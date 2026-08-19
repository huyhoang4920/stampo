import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import CaptureFrame, { CUTTER_H, CUTTER_W, CUTTER_WINDOW } from './CaptureFrame'

/** How far in the photo can be pushed, as a multiple of its opening size. */
const MAX_ZOOM = 8

type UploadCropperProps = {
  /** The uploaded photo, as a data URL. */
  image: string
  punchKey: number
  /** The displayed <img>, so the capture screen can crop from it. */
  imgRef: Ref<HTMLImageElement>
  /** The cutter's window, so its live rect is what gets cropped. */
  windowRef: Ref<HTMLDivElement>
}

/** Where the photo sits: its centre on screen, and how far it's zoomed in. */
type View = { scale: number; centreX: number; centreY: number }

/**
 * Frames an uploaded photo for cutting. The cutter is fixed in the middle of
 * the screen and the photo moves under it — dragged with one finger, pinched
 * with two — which is the way a crop is normally chosen, and means the frame
 * the user is aiming at never wanders off under their hand.
 *
 * The photo is held so it always covers the window: there is no way to line
 * the cut up with empty space.
 */
export default function UploadCropper({ image, punchKey, imgRef, windowRef }: UploadCropperProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  /** Live pointers, so one finger pans and two pinch. */
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ distance: number; midX: number; midY: number } | null>(null)

  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  const [stored, setStored] = useState<View | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const box = stageRef.current?.getBoundingClientRect()
      if (box) setStage({ w: box.width, h: box.height })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // A different photo starts over.
  useEffect(() => {
    setNatural(null)
    setStored(null)
  }, [image])

  const cutW = CUTTER_WINDOW.width
  const cutH = CUTTER_WINDOW.height

  /**
   * The window isn't centred in the cutter body — it sits 1.5px right of and
   * 3.4px above centre. The body is offset by that so the window itself lands
   * on the middle of the screen, which is what the crop is taken from.
   */
  const windowOffsetX = CUTTER_WINDOW.left + CUTTER_WINDOW.width / 2 - CUTTER_W / 2
  const windowOffsetY = CUTTER_WINDOW.top + CUTTER_WINDOW.height / 2 - CUTTER_H / 2

  const ready = Boolean(natural && stage.w > 0 && stage.h > 0)

  /** Small enough to still cover the window — anything less can't be cut. */
  const minScale = natural ? Math.max(cutW / natural.w, cutH / natural.h) : 1
  /** Opens at the height of the screen, as before. */
  const openingScale = natural ? Math.max(stage.h / natural.h, minScale) : 1

  const opening: View = { scale: openingScale, centreX: stage.w / 2, centreY: stage.h / 2 }

  /** Keeps the zoom in range and the photo over the window. */
  function settle(next: View): View {
    if (!natural) return next
    const scale = clamp(next.scale, minScale, openingScale * MAX_ZOOM)
    const shownW = natural.w * scale
    const shownH = natural.h * scale
    // The window is centred, so the photo's centre can only stray by however
    // much of it hangs past the window on that axis.
    const roomX = Math.max(0, (shownW - cutW) / 2)
    const roomY = Math.max(0, (shownH - cutH) / 2)
    return {
      scale,
      centreX: clamp(next.centreX, stage.w / 2 - roomX, stage.w / 2 + roomX),
      centreY: clamp(next.centreY, stage.h / 2 - roomY, stage.h / 2 + roomY),
    }
  }

  const view = ready ? settle(stored ?? opening) : opening
  const shownW = natural ? natural.w * view.scale : 0
  const shownH = natural ? natural.h * view.scale : 0

  /** Zooms about a point on screen, keeping the photo pixel under it still. */
  function zoomAbout(previous: View, factor: number, focusX: number, focusY: number): View {
    const scale = clamp(previous.scale * factor, minScale, openingScale * MAX_ZOOM)
    const applied = scale / previous.scale
    return settle({
      scale,
      centreX: focusX + (previous.centreX - focusX) * applied,
      centreY: focusY + (previous.centreY - focusY) * applied,
    })
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture is only an improvement — the gesture still tracks without it.
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gesture.current = null
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return
    const previousPoint = pointers.current.get(event.pointerId)!
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    const points = [...pointers.current.values()]

    if (points.length >= 2) {
      const [a, b] = points
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      const last = gesture.current
      gesture.current = { distance, midX, midY }
      if (!last || !last.distance) return

      const stageBox = stageRef.current?.getBoundingClientRect()
      const focusX = midX - (stageBox?.left ?? 0)
      const focusY = midY - (stageBox?.top ?? 0)
      const factor = distance / last.distance
      const panX = midX - last.midX
      const panY = midY - last.midY

      setStored((prev) => {
        const base = prev ?? opening
        const zoomed = zoomAbout(base, factor, focusX, focusY)
        // The pinch can travel as well as spread, so carry the midpoint too.
        return settle({ ...zoomed, centreX: zoomed.centreX + panX, centreY: zoomed.centreY + panY })
      })
      return
    }

    const dx = event.clientX - previousPoint.x
    const dy = event.clientY - previousPoint.y
    // Built off the previous state, not the rendered value: several moves can
    // arrive between renders, and reading the render's copy would make each of
    // them start from the same stale position.
    setStored((prev) => {
      const base = prev ?? opening
      return settle({ ...base, centreX: base.centreX + dx, centreY: base.centreY + dy })
    })
  }

  function endPointer(event: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId)
    // Dropping to one finger restarts the pinch rather than jumping the photo.
    gesture.current = null
  }

  /** Trackpad and mouse wheel, so the same framing works on a desktop. */
  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    const stageBox = stageRef.current?.getBoundingClientRect()
    const focusX = event.clientX - (stageBox?.left ?? 0)
    const focusY = event.clientY - (stageBox?.top ?? 0)
    const factor = Math.exp(-event.deltaY / 300)
    setStored((prev) => zoomAbout(prev ?? opening, factor, focusX, focusY))
  }

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onWheel={handleWheel}
    >
      <img
        ref={imgRef}
        src={image}
        alt="Photo to cut a stamp from"
        draggable={false}
        onLoad={(e) =>
          setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
        }
        className="absolute select-none"
        style={{
          left: view.centreX - shownW / 2,
          top: view.centreY - shownH / 2,
          width: shownW || undefined,
          height: shownH || undefined,
          // Preflight caps images at the container width, which would stop a
          // zoomed or landscape photo from running past the edges as intended.
          maxWidth: 'none',
        }}
      />

      {ready && (
        <div
          className="pointer-events-none absolute"
          style={{
            // Fixed in the middle, placed so the *window* is what's centred.
            left: stage.w / 2 - windowOffsetX,
            top: stage.h / 2 - windowOffsetY,
            width: CUTTER_W,
            height: CUTTER_H,
            marginLeft: -CUTTER_W / 2,
            marginTop: -CUTTER_H / 2,
          }}
        >
          <CaptureFrame windowRef={windowRef} punchKey={punchKey} />
        </div>
      )}
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

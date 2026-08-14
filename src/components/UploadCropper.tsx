import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import CaptureFrame, {
  CUTTER_H,
  CUTTER_SCALE,
  CUTTER_W,
  CUTTER_WINDOW,
  type CutterSize,
} from './CaptureFrame'

type UploadCropperProps = {
  /** The uploaded photo, as a data URL. */
  image: string
  size: CutterSize
  punchKey: number
  /** The displayed <img>, so the capture screen can crop from it. */
  imgRef: Ref<HTMLImageElement>
  /** The cutter's window, so its live rect is what gets cropped. */
  windowRef: Ref<HTMLDivElement>
}

/**
 * Where the cut is, and how far the photo has been scrolled under it.
 * `cut` is in the photo's own pixels; `slide` is how much of the photo is off
 * the left/top of the screen.
 */
type View = { cutX: number; cutY: number; slideX: number; slideY: number }

/**
 * Positions the cutter over an uploaded photo, shown at the full height of the
 * screen — so a landscape one runs off both sides, more than fits at once.
 *
 * The cutter moves freely wherever there's screen to move in, and the photo
 * only scrolls once the cutter is pressed against an edge of the screen. Both
 * are needed: driving the scroll off the cutter's position directly would pin
 * it to the middle and it would never appear to move at all.
 */
export default function UploadCropper({
  image,
  size,
  punchKey,
  imgRef,
  windowRef,
}: UploadCropperProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const dragFrom = useRef<{ x: number; y: number } | null>(null)

  const [stage, setStage] = useState({ w: 0, h: 0 })
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)
  /** Null until dragged; the opening view below stands in meanwhile. */
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

  const scale = CUTTER_SCALE[size]
  const cutW = CUTTER_WINDOW.width * scale
  const cutH = CUTTER_WINDOW.height * scale

  /**
   * The window isn't centred in the cutter body — it sits 1.5px right of and
   * 3.4px above centre at scale 1. Everything here positions and clamps the
   * *window*, since that is what gets cropped, so the body is offset by this
   * to compensate.
   */
  const windowOffsetX = (CUTTER_WINDOW.left + CUTTER_WINDOW.width / 2 - CUTTER_W / 2) * scale
  const windowOffsetY = (CUTTER_WINDOW.top + CUTTER_WINDOW.height / 2 - CUTTER_H / 2) * scale

  // Shown at the height of the screen, keeping the photo's aspect ratio.
  const shownH = stage.h
  const shownW = natural && natural.h ? natural.w * (stage.h / natural.h) : 0
  const ready = Boolean(natural && stage.h > 0 && shownW > 0)

  const limits = {
    cutX: [cutW / 2, Math.max(cutW / 2, shownW - cutW / 2)] as const,
    cutY: [cutH / 2, Math.max(cutH / 2, shownH - cutH / 2)] as const,
    slideX: Math.max(0, shownW - stage.w),
    slideY: Math.max(0, shownH - stage.h),
  }

  /**
   * Keeps the cut inside the photo, and scrolls the photo only by however much
   * the cutter would otherwise hang off the edge of the screen.
   */
  function settle(next: View): View {
    const cutX = clamp(next.cutX, limits.cutX[0], limits.cutX[1])
    const cutY = clamp(next.cutY, limits.cutY[0], limits.cutY[1])

    let slideX = next.slideX
    const screenX = cutX - slideX
    if (screenX < cutW / 2) slideX -= cutW / 2 - screenX
    else if (screenX > stage.w - cutW / 2) slideX += screenX - (stage.w - cutW / 2)

    let slideY = next.slideY
    const screenY = cutY - slideY
    if (screenY < cutH / 2) slideY -= cutH / 2 - screenY
    else if (screenY > stage.h - cutH / 2) slideY += screenY - (stage.h - cutH / 2)

    return {
      cutX,
      cutY,
      slideX: clamp(slideX, 0, limits.slideX),
      slideY: clamp(slideY, 0, limits.slideY),
    }
  }

  /** Opens on the middle of the photo, cutter centred on screen. */
  const opening: View = {
    cutX: shownW / 2,
    cutY: shownH / 2,
    slideX: clamp(shownW / 2 - stage.w / 2, 0, limits.slideX),
    slideY: clamp(shownH / 2 - stage.h / 2, 0, limits.slideY),
  }

  // Settled here rather than in an effect: it's pure and idempotent, so this
  // also re-reins the view when the size changes the window's edges, with no
  // extra render pass and nothing to keep in sync.
  const view = ready ? settle(stored ?? opening) : null

  const photoLeft = shownW > stage.w ? -(view?.slideX ?? 0) : (stage.w - shownW) / 2
  const photoTop = shownH > stage.h ? -(view?.slideY ?? 0) : (stage.h - shownH) / 2

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Capture is only an improvement — the drag still tracks without it.
    }
    dragFrom.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const from = dragFrom.current
    if (!from) return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y
    dragFrom.current = { x: event.clientX, y: event.clientY }
    // Built off the previous state, not the rendered value: several moves can
    // arrive between renders, and reading the render's copy here would make
    // each of them start from the same stale position.
    setStored((previous) => {
      const base = previous ?? opening
      return settle({ ...base, cutX: base.cutX + dx, cutY: base.cutY + dy })
    })
  }

  function handlePointerUp() {
    dragFrom.current = null
  }

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
          left: photoLeft,
          top: photoTop,
          height: shownH || undefined,
          width: shownW || undefined,
          // Preflight caps images at the container width, which would stop a
          // landscape photo from running past the edges as intended.
          maxWidth: 'none',
        }}
      />

      {ready && view && (
        <div
          className="absolute"
          style={{
            // Placed so the *window* lands on the cut point, not the body.
            left: photoLeft + view.cutX - windowOffsetX,
            top: photoTop + view.cutY - windowOffsetY,
            width: CUTTER_W,
            height: CUTTER_H,
            marginLeft: -CUTTER_W / 2,
            marginTop: -CUTTER_H / 2,
          }}
        >
          <CaptureFrame windowRef={windowRef} punchKey={punchKey} size={size} />
        </div>
      )}
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

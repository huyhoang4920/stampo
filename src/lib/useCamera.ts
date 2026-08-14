import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable'
export type Facing = 'environment' | 'user'

/**
 * Focus and point-of-interest constraints aren't in the DOM typings, and no
 * engine implements all of them — they're requested through `advanced`, which
 * browsers are required to ignore when unsupported rather than fail on.
 */
type FocusConstraint = {
  focusMode?: 'continuous' | 'single-shot' | 'manual'
  pointsOfInterest?: { x: number; y: number }[]
}
type ExtendedCapabilities = MediaTrackCapabilities & {
  focusMode?: string[]
  pointsOfInterest?: unknown
}

function videoConstraints(facing: Facing): MediaTrackConstraints {
  return {
    facingMode: { ideal: facing },
    // The stamp is cropped out of a fraction of the frame, so frame
    // resolution is what decides how sharp the finished stamp looks. Asking
    // high and letting the device fall back beats accepting a 640x480 default.
    width: { ideal: 2560 },
    height: { ideal: 1440 },
    advanced: [{ focusMode: 'continuous' } as FocusConstraint],
  } as MediaTrackConstraints
}

/** Opens the device camera and keeps it live for as long as `active` is true. */
export function useCamera(active: boolean) {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [facing, setFacing] = useState<Facing>('environment')
  const streamRef = useRef<MediaStream | null>(null)
  const videosRef = useRef<Set<HTMLVideoElement>>(new Set())

  useEffect(() => {
    if (!active) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }

    let cancelled = false
    setStatus('requesting')

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints(facing), audio: false })
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        // Some devices only honour focus once the track is live, so it's asked
        // for again here rather than relying on the initial constraints alone.
        await requestContinuousFocus(stream)
        // Attach to any <video> that mounted before the stream arrived.
        videosRef.current.forEach((video) => {
          if (video.srcObject !== stream) video.srcObject = stream
        })
        setStatus('ready')
      })
      .catch((error: DOMException) => {
        if (cancelled) return
        setStatus(error.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [active, facing])

  /** Attach the live stream to the preview <video> element. */
  const attach = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return
    videosRef.current.add(video)
    if (streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current
    }
  }, [])

  const flip = useCallback(() => {
    setFacing((current) => (current === 'environment' ? 'user' : 'environment'))
  }, [])

  /**
   * Focus on a point, given in 0..1 of the frame. Only some Android/Chrome
   * devices expose this; elsewhere it's a no-op and the camera's own
   * continuous autofocus keeps doing the work.
   */
  const focusAt = useCallback(async (x: number, y: number) => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const caps = track.getCapabilities?.() as ExtendedCapabilities | undefined
    try {
      if (caps?.pointsOfInterest) {
        await track.applyConstraints({
          advanced: [{ pointsOfInterest: [{ x, y }], focusMode: 'single-shot' }] as FocusConstraint[],
        } as MediaTrackConstraints)
      } else if (caps?.focusMode?.includes('single-shot')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'single-shot' }] as FocusConstraint[],
        } as MediaTrackConstraints)
      }
    } catch {
      // Focus control is best-effort; a rejection just leaves autofocus alone.
    }
  }, [])

  /**
   * The front camera is previewed mirrored, the way people expect to see
   * themselves — so captures are mirrored to match. The window has to show
   * exactly what gets cropped.
   */
  const mirrored = facing === 'user'

  /**
   * Just the part of the current frame that falls inside `viewportRect` — a
   * rect in on-screen CSS pixels, e.g. from `element.getBoundingClientRect()`.
   * Used to crop straight to whatever the viewfinder window is showing.
   */
  const snapshotRegion = useCallback(
    (video: HTMLVideoElement, viewportRect: DOMRect): string | null => {
      const native = mapViewportRectToVideo(video, viewportRect)
      if (!native) return null

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(native.width)
      canvas.height = Math.round(native.height)
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // A mirrored preview means the pixels under a given screen x live at the
      // opposite side of the frame, so the source window flips with it.
      const sourceX = mirrored
        ? video.videoWidth - (native.x + native.width)
        : native.x

      if (mirrored) {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(
        video,
        sourceX,
        native.y,
        native.width,
        native.height,
        0,
        0,
        canvas.width,
        canvas.height,
      )
      return canvas.toDataURL('image/jpeg', 0.92)
    },
    [mirrored],
  )

  return { status, facing, mirrored, attach, flip, focusAt, snapshotRegion }
}

async function requestContinuousFocus(stream: MediaStream) {
  const track = stream.getVideoTracks()[0]
  if (!track) return
  const caps = track.getCapabilities?.() as ExtendedCapabilities | undefined
  if (!caps?.focusMode?.includes('continuous')) return
  try {
    await track.applyConstraints({
      advanced: [{ focusMode: 'continuous' }] as FocusConstraint[],
    } as MediaTrackConstraints)
  } catch {
    // Best-effort: the camera's default behaviour still applies.
  }
}

/**
 * Converts a rect in on-screen CSS pixels into the matching rect in the
 * video's native pixel space, accounting for the crop `object-fit: cover`
 * applies when the video's aspect ratio doesn't match its display box.
 */
function mapViewportRectToVideo(video: HTMLVideoElement, viewportRect: DOMRect) {
  const { videoWidth: natW, videoHeight: natH } = video
  if (!natW || !natH) return null

  const videoRect = video.getBoundingClientRect()
  if (!videoRect.width || !videoRect.height) return null

  const scale = Math.max(videoRect.width / natW, videoRect.height / natH)
  const renderedW = natW * scale
  const renderedH = natH * scale
  const offsetX = (videoRect.width - renderedW) / 2
  const offsetY = (videoRect.height - renderedH) / 2

  const x = (viewportRect.left - videoRect.left - offsetX) / scale
  const y = (viewportRect.top - videoRect.top - offsetY) / scale
  const width = viewportRect.width / scale
  const height = viewportRect.height / scale

  // Clamp — the window should always sit within the video, but guard against
  // rounding at the very edges so drawImage never gets an out-of-range source.
  const clampedX = Math.max(0, Math.min(x, natW - 1))
  const clampedY = Math.max(0, Math.min(y, natH - 1))
  return {
    x: clampedX,
    y: clampedY,
    width: Math.min(width, natW - clampedX),
    height: Math.min(height, natH - clampedY),
  }
}

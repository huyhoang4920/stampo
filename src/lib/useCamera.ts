import { useEffect, useRef, useState } from 'react'

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'unavailable'

/** Opens the device camera and keeps it live for as long as `active` is true. */
export function useCamera(active: boolean) {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!active) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable')
      return
    }

    let cancelled = false
    setStatus('requesting')

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
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
  }, [active])

  /** Attach the live stream to the preview <video> element. */
  function attach(video: HTMLVideoElement | null) {
    if (video && streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current
    }
  }

  /** The whole current frame, at the camera's native resolution. */
  function snapshot(video: HTMLVideoElement): string | null {
    if (!video.videoWidth) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  /**
   * Just the part of the current frame that falls inside `viewportRect` — a
   * rect in on-screen CSS pixels, e.g. from `element.getBoundingClientRect()`.
   * Used to crop straight to whatever the viewfinder window is showing, since
   * the video is displayed full-screen with `object-fit: cover` and the
   * window shows a plain, undimmed cutout of that same element (see
   * CaptureFrame) — what's visible in the window is exactly what this maps
   * back to native pixels and crops.
   */
  function snapshotRegion(video: HTMLVideoElement, viewportRect: DOMRect): string | null {
    const native = mapViewportRectToVideo(video, viewportRect)
    if (!native) return null
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(native.width)
    canvas.height = Math.round(native.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(
      video,
      native.x,
      native.y,
      native.width,
      native.height,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  return { status, attach, snapshot, snapshotRegion }
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

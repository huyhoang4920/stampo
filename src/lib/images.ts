/**
 * Resolves once the browser actually has the bitmap ready to paint. Setting an
 * `<img src>` to a data URL doesn't decode synchronously, so a stamp shown in
 * the same frame can paint as an empty card first — a visible flicker. Waiting
 * on this before revealing it means the first painted frame has the photo.
 */
export function decodeImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = src
    const done = () => resolve()
    if (typeof img.decode === 'function') img.decode().then(done, done)
    else {
      img.onload = done
      img.onerror = done
    }
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Shrinks an image so its longest edge is at most `maxEdge`, leaving it alone
 * if it already is. A cut is normally a few hundred KB at most, but frame
 * sizes vary wildly between devices and this is stored as text in a quota'd
 * store — so it's worth a ceiling.
 */
export function capImageSize(src: string, maxEdge: number, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const longest = Math.max(img.naturalWidth, img.naturalHeight)
      if (!longest || longest <= maxEdge) return resolve(src)

      const ratio = maxEdge / longest
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * ratio)
      canvas.height = Math.round(img.naturalHeight * ratio)
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(src)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

/**
 * Crops the part of a displayed `<img>` that falls inside `viewportRect` — a
 * rect in on-screen CSS pixels — and returns it at the image's own resolution.
 * The uploaded-photo counterpart to useCamera's snapshotRegion.
 */
export function cropImageRegion(
  img: HTMLImageElement,
  viewportRect: DOMRect,
  quality = 0.92,
): string | null {
  const box = img.getBoundingClientRect()
  if (!box.width || !box.height || !img.naturalWidth) return null

  // One number for both axes: the image is laid out at its own aspect ratio.
  const toNatural = img.naturalWidth / box.width
  const x = (viewportRect.left - box.left) * toNatural
  const y = (viewportRect.top - box.top) * toNatural
  const width = viewportRect.width * toNatural
  const height = viewportRect.height * toNatural

  // The window is clamped to the image while dragging, so this only absorbs
  // sub-pixel rounding at the very edges.
  const sx = Math.max(0, Math.min(x, img.naturalWidth - 1))
  const sy = Math.max(0, Math.min(y, img.naturalHeight - 1))
  const sw = Math.min(width, img.naturalWidth - sx)
  const sh = Math.min(height, img.naturalHeight - sy)

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(sw))
  canvas.height = Math.max(1, Math.round(sh))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', quality)
}

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

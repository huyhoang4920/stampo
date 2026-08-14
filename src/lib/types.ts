/** A stamp the user cut out of a photo and filed into their collection. */
export type Stamp = {
  id: string
  /**
   * The cut stamp artwork, stored as a data URL so it survives a reload.
   *
   * Only the cut is kept, not the photo it came from. The full frame ran to
   * several megabytes as a data URL, which overran the storage an origin gets
   * and left saving broken — and nothing read it. Re-cropping a filed stamp
   * would need it back, but that wants IndexedDB rather than localStorage.
   */
  image: string
  /** Where the stamp was collected, free text (e.g. "Kyoto, Japan"). */
  location: string
  /** Date on the stamp, ISO yyyy-mm-dd. */
  date: string
  /** When the stamp was filed, epoch ms. */
  createdAt: number
}

export type NewStamp = Omit<Stamp, 'id' | 'createdAt'>

/** A stamp the user cut out of a photo and filed into their collection. */
export type Stamp = {
  id: string
  /** Cropped stamp artwork, stored as a data URL so it survives a reload. */
  image: string
  /** Optional untouched source photo, kept so a stamp can be re-cropped. */
  source?: string
  /** Where the stamp was collected, free text (e.g. "Kyoto, Japan"). */
  location: string
  /** Date on the stamp, ISO yyyy-mm-dd. */
  date: string
  /** When the stamp was filed, epoch ms. */
  createdAt: number
}

export type NewStamp = Omit<Stamp, 'id' | 'createdAt'>

/** Draft carried across the capture → crop → details screens. */
export type StampDraft = {
  source?: string
  cropped?: string
  location?: string
  date?: string
}

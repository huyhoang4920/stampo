import type { NewStamp, Stamp } from './types'

const KEY = 'stampo.collection.v1'

function read(): Stamp[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Stamp[]) : []
  } catch {
    return []
  }
}

/** Thrown when the origin's storage can't take another stamp. */
export class CollectionFullError extends Error {
  constructor() {
    super('No room left in storage for another stamp.')
    this.name = 'CollectionFullError'
  }
}

function write(stamps: Stamp[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(stamps))
  } catch {
    // Quota is the only realistic failure here, and it has to reach the caller:
    // swallowing it is what made saving look like it simply did nothing.
    throw new CollectionFullError()
  }
}

export function listStamps(): Stamp[] {
  return read().sort((a, b) => b.createdAt - a.createdAt)
}

export function getStamp(id: string): Stamp | undefined {
  return read().find((s) => s.id === id)
}

export function addStamp(stamp: NewStamp): Stamp {
  const saved: Stamp = { ...stamp, id: crypto.randomUUID(), createdAt: Date.now() }
  write([...read(), saved])
  return saved
}

/** Change a stamp's details in place; identity and filing date are kept. */
export function updateStamp(id: string, patch: Partial<Pick<Stamp, 'date' | 'location'>>) {
  write(read().map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

export function removeStamp(id: string) {
  write(read().filter((s) => s.id !== id))
}

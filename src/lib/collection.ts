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

function write(stamps: Stamp[]) {
  localStorage.setItem(KEY, JSON.stringify(stamps))
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

export function removeStamp(id: string) {
  write(read().filter((s) => s.id !== id))
}

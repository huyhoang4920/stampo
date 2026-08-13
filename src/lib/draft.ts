import type { StampDraft } from './types'

const KEY = 'stampo.draft.v1'

/**
 * Carries the in-progress stamp across capture → crop → details. sessionStorage
 * rather than router state so a reload (or the camera permission prompt
 * backgrounding the tab) doesn't lose the photo.
 */
export function saveDraft(patch: StampDraft) {
  const current = readDraft()
  sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }))
}

export function readDraft(): StampDraft {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StampDraft) : {}
  } catch {
    return {}
  }
}

export function clearDraft() {
  sessionStorage.removeItem(KEY)
}

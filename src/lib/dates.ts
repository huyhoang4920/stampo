/** Today as `yyyy-mm-dd`, in local time — what `<input type="date">` expects. */
export function todayISO(): string {
  const now = new Date()
  const offsetMinutes = now.getTimezoneOffset()
  return new Date(now.getTime() - offsetMinutes * 60_000).toISOString().slice(0, 10)
}

/** `yyyy-mm-dd` → `dd.mm.yyyy`, the format the collection headings use. */
export function formatStampDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return year && month && day ? `${day}.${month}.${year}` : iso
}

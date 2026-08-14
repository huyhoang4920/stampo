import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Stamp from '../components/Stamp'
import StampDetail from '../components/StampDetail'
import Postmark from '../components/Postmark'
import { listStamps, removeStamp, updateStamp } from '../lib/collection'
import type { Stamp as StampType } from '../lib/types'
import { formatStampDate } from '../lib/dates'

/** The scale-up when a stamp is opened, and the scale-down when it closes. */
const OPEN_MS = 420

type Rect = { left: number; top: number; width: number; height: number }
type Detail = { stamp: StampType; from: Rect }

export default function Collection() {
  const navigate = useNavigate()
  const [stamps, setStamps] = useState<StampType[]>([])
  const [detail, setDetail] = useState<Detail | null>(null)
  const [closing, setClosing] = useState(false)
  const [ready, setReady] = useState(false)

  const carrierRef = useRef<HTMLDivElement | null>(null)
  const timers = useRef<number[]>([])

  const refresh = useCallback(() => setStamps(listStamps()), [])

  useEffect(refresh, [refresh])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  /**
   * Opening: the detail stamp renders at full size, gets put back onto the
   * grid cell it came from, and is released in the same pass — so it grows
   * and travels out of exactly the cell that was tapped.
   *
   * Written straight onto the node rather than through React state: the start
   * and end transforms have to reach the DOM either side of one forced style
   * flush, which a re-render can't guarantee.
   */
  useLayoutEffect(() => {
    const el = carrierRef.current
    if (!detail || closing || !el) return

    const rest = el.getBoundingClientRect()
    el.style.visibility = 'visible'
    el.style.transformOrigin = 'center'
    el.style.transition = 'none'
    el.style.transform = offsetOnto(detail.from, rest)

    // Commits the start state, so the change below animates from it.
    void el.offsetHeight

    el.style.transition = `transform ${OPEN_MS}ms var(--ease-out-soft)`
    el.style.transform = 'none'

    timers.current.push(window.setTimeout(() => setReady(true), OPEN_MS * 0.6))
  }, [detail, closing])

  function handleOpen(stamp: StampType, cell: HTMLElement) {
    const box = cell.getBoundingClientRect()
    setReady(false)
    setDetail({
      stamp,
      from: { left: box.left, top: box.top, width: box.width, height: box.height },
    })
  }

  /** Flies the stamp back to its cell, then tears the overlay down. */
  function handleClose() {
    const el = carrierRef.current
    if (!detail || !el) return

    // Measured while it sits at rest, which is the flight's starting point.
    const rest = el.getBoundingClientRect()
    setReady(false)
    setClosing(true)
    el.style.transition = `transform ${OPEN_MS}ms var(--ease-out-soft)`
    el.style.transform = offsetOnto(detail.from, rest)

    timers.current.push(
      window.setTimeout(() => {
        setDetail(null)
        setClosing(false)
      }, OPEN_MS),
    )
  }

  function handleDelete() {
    if (!detail) return
    removeStamp(detail.stamp.id)
    refresh()
    // Straight out, no reverse flight — the cell it would fly back to is gone.
    setDetail(null)
    setClosing(false)
    setReady(false)
  }

  function handleSave(patch: { date: string; location: string }) {
    if (!detail) return
    updateStamp(detail.stamp.id, patch)
    // Only the grid behind is refreshed. Replacing `detail` here would change
    // the open-flight effect's dependency and replay the whole scale-up.
    refresh()
  }

  const groups = groupByDate(stamps)

  return (
    <div className="relative min-h-dvh bg-flame">
      <div className="px-6 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {/*
          The postmark rides up here beside Back rather than next to the
          title: at this display size "Your stamp" alone is nearly the full
          content width, so anything sharing its line would collide.
        */}
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="label w-fit rounded-full border-[0.5px] border-sun px-4 py-2 text-sun"
          >
            ← BACK
          </button>
          <Postmark className="shrink-0" />
        </div>

        <h1 className="mt-6 text-[36px] leading-[0.95] font-extrabold tracking-[-0.03em] text-sun">
          Your stamp collection
        </h1>

        {stamps.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-[17px] leading-[24px] text-white/85">No stamps yet.</p>
            <button
              type="button"
              onClick={() => navigate('/capture')}
              className="label mt-6 rounded-full bg-sun px-8 py-3 text-ink active:scale-95"
            >
              MAKE YOUR FIRST
            </button>
          </div>
        ) : (
          <div className="mt-10">
            {groups.map(({ date, items }, index) => (
              <section key={date} className={index > 0 ? 'mt-8' : undefined}>
                <h2 className="label text-left text-[17px] text-ink">{formatStampDate(date)}</h2>

                {/*
                  Three across with no gaps, so neighbouring stamps meet at
                  their perforations the way a sheet of them would.
                */}
                <div className="mt-4 grid grid-cols-3">
                  {items.map((stamp) => (
                    <button
                      key={stamp.id}
                      type="button"
                      onClick={(e) => handleOpen(stamp, e.currentTarget)}
                      aria-label={`Open stamp from ${formatStampDate(stamp.date)}${
                        stamp.location ? `, ${stamp.location}` : ''
                      }`}
                      className="relative block active:scale-[0.97] transition-transform"
                      // Hidden while it's the one open, so the opened stamp is
                      // the only one of it on screen.
                      style={{
                        visibility: detail?.stamp.id === stamp.id ? 'hidden' : 'visible',
                      }}
                    >
                      <Stamp image={stamp.image} animate={false} width="100%" />
                    </button>
                  ))}
                </div>

                <div className="mt-8 border-t-2 border-dashed border-sun/70" />
              </section>
            ))}
          </div>
        )}
      </div>

      {detail && (
        <StampDetail
          stamp={detail.stamp}
          carrierRef={carrierRef}
          ready={ready}
          onClose={handleClose}
          onSend={(stamp) => navigate(`/send?stamp=${stamp.id}`)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

/** The transform that puts an element of `rest` size back onto `from`. */
function offsetOnto(from: Rect, rest: DOMRect): string {
  const dx = from.left + from.width / 2 - (rest.left + rest.width / 2)
  const dy = from.top + from.height / 2 - (rest.top + rest.height / 2)
  const scaleX = from.width / rest.width
  const scaleY = from.height / rest.height
  return `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`
}

/** Newest day first, matching the order stamps come back in. */
function groupByDate(stamps: StampType[]): { date: string; items: StampType[] }[] {
  const byDate = new Map<string, StampType[]>()
  for (const stamp of stamps) {
    const existing = byDate.get(stamp.date)
    if (existing) existing.push(stamp)
    else byDate.set(stamp.date, [stamp])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, items }))
}

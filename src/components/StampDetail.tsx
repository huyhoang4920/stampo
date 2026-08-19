import { useEffect, useState } from 'react'
import type { Ref } from 'react'
import Stamp from './Stamp'
import StampDeco from './StampDeco'
import type { Stamp as StampType } from '../lib/types'
import { formatStampDate } from '../lib/dates'

/** How wide the stamp sits when opened — the target of the scale-up. */
export const DETAIL_STAMP_WIDTH = 'min(58vw, 240px)'

/** How long the backdrop takes to fade in or out. */
const BACKDROP_MS = 300

type StampDetailProps = {
  stamp: StampType
  /**
   * Wraps the stamp. The collection screen writes transform/transition
   * straight onto this node to run the open and close flights, so nothing
   * here should manage those properties.
   */
  carrierRef: Ref<HTMLDivElement>
  /** True once the stamp has finished scaling up — gates the text and actions. */
  ready: boolean
  /** True while flying back to the grid — fades the backdrop out ahead of unmount. */
  closing: boolean
  onClose: () => void
  onSend: (stamp: StampType) => void
  onSave: (patch: { date: string; location: string }) => void
  onDelete: () => void
}

type Mode = 'view' | 'edit' | 'confirm-delete'

/**
 * The opened stamp: the same card from the grid, scaled up, with its details
 * and the actions that can be taken on it. Rendered by Collection so the
 * carrier it hands down can be measured and animated from the grid position.
 */
export default function StampDetail({
  stamp,
  carrierRef,
  ready,
  closing,
  onClose,
  onSend,
  onSave,
  onDelete,
}: StampDetailProps) {
  const [mode, setMode] = useState<Mode>('view')
  const [date, setDate] = useState(stamp.date)
  const [location, setLocation] = useState(stamp.location)
  /** Last committed values, so Cancel can restore them after an edit. */
  const [saved, setSaved] = useState({ date: stamp.date, location: stamp.location })
  /**
   * Starts false on the very first paint, then flips true a tick later —
   * that gap is what gives the backdrop's opacity transition below something
   * to animate from, so opening fades it in instead of it just appearing.
   */
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Visible on the same beat as the backdrop, in both directions — only
  // whether it can be tapped still waits on `ready`, so nothing responds to
  // a stray touch while the stamp is still mid-flight to its resting spot.
  const fade = `transition-opacity duration-300 ${mounted && !closing ? 'opacity-100' : 'opacity-0'} ${
    ready ? '' : 'pointer-events-none'
  }`

  return (
    <div className="absolute inset-0 z-30 flex flex-col overflow-y-auto px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {/*
        A separate layer rather than the background on this whole container:
        everything else here (the stamp especially) needs to stay fully
        opaque throughout, so only the flame ground itself fades — in on
        mount, out ahead of Collection unmounting this on close.
      */}
      <div
        className="absolute inset-0 -z-10 bg-flame transition-opacity ease-out"
        style={{
          transitionDuration: `${BACKDROP_MS}ms`,
          opacity: mounted && !closing ? 1 : 0,
        }}
      />

      <button
        type="button"
        onClick={onClose}
        className={`label w-fit rounded-full border-[0.5px] border-sun px-4 py-2 text-sun ${fade}`}
      >
        ← CLOSE
      </button>

      <StampDeco variant="blue" className={fade} />

      {/*
        Hidden until Collection has measured it and put it back on the grid
        cell, so it never flashes at full size in the wrong place. Doubles as
        a close tap once settled — a lightbox reads as dismissable by its own
        image, not just the button above it.
      */}
      <div
        ref={carrierRef}
        className="mx-auto mt-8 w-fit cursor-pointer"
        style={{ visibility: 'hidden' }}
        onClick={ready ? onClose : undefined}
      >
        <Stamp image={stamp.image} animate={false} width={DETAIL_STAMP_WIDTH} />
      </div>

      {/*
        Shows the locally-held values, not the stamp prop — an edit is saved
        straight to storage, so re-fetching it into this overlay would restart
        the open flight for no reason.
      */}
      {mode === 'view' && (
        <div className={`mt-8 text-center ${fade}`}>
          <p className="font-headline text-[28px] leading-[1.1] font-medium tracking-[-0.02em] text-sun">
            {formatStampDate(date)}
          </p>
          {location && <p className="mt-2 text-[15px] leading-[22px] text-white/85">{location}</p>}
        </div>
      )}

      {mode === 'edit' && (
        <div className={`mt-8 ${fade}`}>
          <label className="label block text-left text-white/70" htmlFor="edit-date">
            DATE
          </label>
          <input
            id="edit-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-[16px] text-ink"
          />

          <label className="label mt-5 block text-left text-white/70" htmlFor="edit-location">
            LOCATION
          </label>
          <input
            id="edit-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Where did you find it?"
            className="mt-2 w-full rounded-xl border border-white/40 bg-white/90 px-4 py-3 text-[16px] text-ink placeholder:text-ink/35"
          />
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div className={`mt-8 text-center ${fade}`}>
          <p className="font-headline text-[22px] leading-[1.15] font-medium tracking-[-0.02em] text-sun">
            Delete this stamp?
          </p>
          <p className="mx-auto mt-2 max-w-[28ch] text-[15px] leading-[22px] text-white/85">
            It leaves your collection for good — this can't be undone.
          </p>
        </div>
      )}

      <div className={`mt-auto flex flex-col gap-3 pt-8 ${fade}`}>
        {mode === 'view' && (
          <>
            <button
              type="button"
              onClick={() => onSend(stamp)}
              className="label w-full rounded-full bg-sun py-4 text-ink active:scale-[0.98]"
            >
              SEND THIS STAMP
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="label flex-1 rounded-full border-[0.5px] border-sun py-4 text-sun active:scale-[0.98]"
              >
                EDIT
              </button>
              <button
                type="button"
                onClick={() => setMode('confirm-delete')}
                className="label flex-1 rounded-full border-[0.5px] border-white/50 py-4 text-white/80 active:scale-[0.98]"
              >
                DELETE
              </button>
            </div>
          </>
        )}

        {mode === 'edit' && (
          <>
            <button
              type="button"
              onClick={() => {
                const next = { date, location: location.trim() }
                setLocation(next.location)
                setSaved(next)
                onSave(next)
                setMode('view')
              }}
              className="label w-full rounded-full bg-sun py-4 text-ink active:scale-[0.98]"
            >
              SAVE CHANGES
            </button>
            <button
              type="button"
              onClick={() => {
                // Back to whatever was last saved, discarding this edit.
                setDate(saved.date)
                setLocation(saved.location)
                setMode('view')
              }}
              className="label w-full rounded-full border-[0.5px] border-sun py-4 text-sun active:scale-[0.98]"
            >
              CANCEL
            </button>
          </>
        )}

        {mode === 'confirm-delete' && (
          <>
            <button
              type="button"
              onClick={onDelete}
              className="label w-full rounded-full bg-ink py-4 text-white active:scale-[0.98]"
            >
              DELETE STAMP
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="label w-full rounded-full border-[0.5px] border-sun py-4 text-sun active:scale-[0.98]"
            >
              KEEP IT
            </button>
          </>
        )}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Stamp from '../components/Stamp'
import { PaperInput, PaperTextarea } from '../components/PaperField'
import LetterSequence from '../components/LetterSequence'
import { recordFilm } from '../lib/letterFilm'
import { listStamps } from '../lib/collection'
import type { Stamp as StampType } from '../lib/types'
import { formatStampDate } from '../lib/dates'

/**
 * 'compose' — who it's from and to, a title, and the letter itself.
 * 'sending' — the stop-motion send-off plays out.
 */
type Stage = 'compose' | 'sending'

/**
 * The letter flow. Any stamp in the collection can be the one sent; arriving
 * with `?stamp=<id>` — as the capture result screen and the collection both
 * do — just picks that one out of the row to begin with.
 */
export default function SendLetter() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [stamps, setStamps] = useState<StampType[]>([])
  const [chosenId, setChosenId] = useState<string | null>(null)

  const [stage, setStage] = useState<Stage>('compose')
  /** Frame reached while saving, so the button can say how far along it is. */
  const [saving, setSaving] = useState<{ at: number; of: number } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const id = params.get('stamp')

  useEffect(() => {
    const all = listStamps()
    setStamps(all)
    setChosenId((current) => {
      if (current && all.some((s) => s.id === current)) return current
      if (id && all.some((s) => s.id === id)) return id
      return all[0]?.id ?? null
    })
  }, [id])

  const stamp = stamps.find((s) => s.id === chosenId)

  /**
   * Brings the starting pick into view once, so arriving from the collection
   * doesn't leave the chosen stamp somewhere off the end of the row. Only the
   * first time — doing it on every pick would yank the row around under
   * someone who is scrolling it themselves.
   */
  const centred = useRef(false)
  const centreOnce = useCallback((el: HTMLButtonElement | null) => {
    if (!el || centred.current) return
    centred.current = true
    el.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [])

  const details = {
    sender,
    receiver,
    title,
    message,
    stampImage: stamp?.image,
    location: stamp?.location ?? '',
    date: stamp ? formatStampDate(stamp.date) : '',
  }

  /*
   * The send-off gets the whole screen — the mailbox is the scene, so letting
   * the page's own ground frame it would read as a picture of a mailbox rather
   * than the letter actually going into one.
   */
  async function saveFilm() {
    if (saving) return
    setSaveError(null)
    setSaving({ at: 0, of: 0 })
    try {
      const { blob, extension } = await recordFilm(details, (at, of) => setSaving({ at, of }))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `stampo-letter.${extension}`
      link.click()
      // Left long enough for the browser to have taken the file off the URL.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      setSaveError("Couldn't save the sequence on this device.")
    } finally {
      setSaving(null)
    }
  }

  if (stage === 'sending') {
    return (
      <div className="relative min-h-dvh">
        <LetterSequence details={details} className="h-dvh w-full" />
        <button
          type="button"
          onClick={() => setStage('compose')}
          className="label absolute top-[max(1.5rem,env(safe-area-inset-top))] left-6 z-10 w-fit rounded-full border-[0.5px] border-sun bg-post-red px-4 py-2 text-sun"
        >
          ← BACK
        </button>

        <div className="absolute inset-x-6 bottom-[max(2rem,env(safe-area-inset-bottom))] z-10">
          {saveError && (
            <p className="mb-2 text-center text-[14px] leading-[20px] text-sun">{saveError}</p>
          )}
          <button
            type="button"
            onClick={saveFilm}
            disabled={!!saving}
            className="label w-full rounded-full bg-sun py-4 text-ink active:scale-[0.98] disabled:opacity-70"
          >
            {saving
              ? saving.of
                ? `SAVING ${saving.at}/${saving.of}`
                : 'SAVING…'
              : 'SAVE THIS LETTER'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-sun px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="label w-fit rounded-full border-[0.5px] border-ink px-4 py-2"
      >
        ← BACK
      </button>

      <>
          <h1 className="mt-6 whitespace-pre-line font-headline text-[48px] leading-[0.95] font-medium tracking-[-0.03em]">
            {'Send a\nletter'}
          </h1>

          {stamps.length === 0 ? (
            <p className="label mt-8 text-ink/50">No stamps yet — cut one first.</p>
          ) : (
            <>
              {/*
                Runs past the page's own padding on both sides, so a stamp can
                sit half off the edge and read as a row that carries on rather
                than one that has been cut short.
              */}
              <div className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {stamps.map((s) => {
                  const chosen = s.id === chosenId
                  return (
                    <button
                      key={s.id}
                      ref={chosen ? centreOnce : undefined}
                      type="button"
                      onClick={() => setChosenId(s.id)}
                      aria-pressed={chosen}
                      aria-label={`Send the stamp from ${formatStampDate(s.date)}${
                        s.location ? `, ${s.location}` : ''
                      }`}
                      className={`shrink-0 snap-center transition-[opacity,transform] duration-200 ${
                        chosen ? 'opacity-100' : 'scale-90 opacity-40'
                      }`}
                    >
                      <Stamp image={s.image} animate={false} width="min(42vw, 170px)" />
                    </button>
                  )
                })}
              </div>

              {stamp?.location && <p className="label mt-4 text-ink/60">{stamp.location}</p>}
            </>
          )}

          {/* Same lined-paper fields the stamp's own details are written on. */}
          <div className="mt-8">
            <div className="flex gap-3">
              <PaperInput
                id="letter-sender"
                label="FROM"
                value={sender}
                onChange={setSender}
                placeholder="You"
                className="flex-1"
              />
              <PaperInput
                id="letter-receiver"
                label="TO"
                value={receiver}
                onChange={setReceiver}
                placeholder="Who?"
                className="flex-1"
              />
            </div>

            <PaperInput
              id="letter-title"
              label="TITLE"
              value={title}
              onChange={setTitle}
              placeholder="Give it a name"
              className="mt-5"
            />

            <PaperTextarea
              id="letter-message"
              label="MESSAGE"
              value={message}
              onChange={setMessage}
              placeholder="Write a little something…"
              className="mt-5"
            />
          </div>

          {/*
            `mt-auto` holds this to the bottom when the form leaves room, and
            the padding keeps a gap off the message field when it doesn't.
          */}
          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => setStage('sending')}
              disabled={!stamp}
              className="label w-full rounded-full bg-post-red-deep py-4 text-white active:scale-[0.98] disabled:opacity-50"
            >
              NEXT
            </button>
          </div>
      </>
    </div>
  )
}

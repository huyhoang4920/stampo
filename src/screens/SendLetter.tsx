import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Stamp from '../components/Stamp'
import { PaperInput, PaperTextarea } from '../components/PaperField'
import LetterSequence from '../components/LetterSequence'
import { getStamp } from '../lib/collection'
import type { Stamp as StampType } from '../lib/types'
import { formatStampDate } from '../lib/dates'

/**
 * 'compose' — who it's from and to, a title, and the letter itself.
 * 'sending' — the stop-motion send-off plays out.
 */
type Stage = 'compose' | 'sending'

/**
 * The letter flow. The stamp being sent arrives as `?stamp=<id>`, set by both
 * the capture result screen and the collection.
 */
export default function SendLetter() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [stamp, setStamp] = useState<StampType | undefined>()

  const [stage, setStage] = useState<Stage>('compose')
  const [sender, setSender] = useState('')
  const [receiver, setReceiver] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  const id = params.get('stamp')

  useEffect(() => {
    setStamp(id ? getStamp(id) : undefined)
  }, [id])

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

          {stamp ? (
            <div className="mt-8 flex flex-col items-center">
              <Stamp image={stamp.image} animate={false} width="min(42vw, 170px)" />
              <p className="label mt-4 text-ink/60">
                {formatStampDate(stamp.date)}
                {stamp.location ? ` · ${stamp.location}` : ''}
              </p>
            </div>
          ) : (
            <p className="label mt-8 text-ink/50">
              {id ? "That stamp isn't in your collection." : 'No stamp chosen yet.'}
            </p>
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
              className="label w-full rounded-full bg-post-red-deep py-4 text-white active:scale-[0.98]"
            >
              NEXT
            </button>
          </div>
      </>
    </div>
  )
}

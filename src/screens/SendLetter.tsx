import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Stamp from '../components/Stamp'
import { getStamp } from '../lib/collection'
import type { Stamp as StampType } from '../lib/types'
import { formatStampDate } from '../lib/dates'

/**
 * Stub for the letter flow. It already receives the stamp being sent — via
 * `?stamp=<id>`, set by both the capture result screen and the collection —
 * so the handoff is real even though the rest of the flow is still to come.
 */
export default function SendLetter() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [stamp, setStamp] = useState<StampType | undefined>()

  const id = params.get('stamp')

  useEffect(() => {
    setStamp(id ? getStamp(id) : undefined)
  }, [id])

  return (
    <div className="flex min-h-dvh flex-col bg-sun px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="label w-fit rounded-full border-[0.5px] border-ink px-4 py-2"
      >
        ← BACK
      </button>

      <div className="mt-16">
        <h1 className="whitespace-pre-line font-headline text-[48px] leading-[0.95] font-medium tracking-[-0.03em]">
          {'Send a\nletter'}
        </h1>
        <p className="mt-5 max-w-[30ch] text-[15px] leading-[22px] text-ink/70">
          Renders your stamp into a short video to share — the flow for writing
          the letter is still to come.
        </p>
      </div>

      {stamp ? (
        <div className="mt-10 flex flex-col items-center">
          <Stamp image={stamp.image} animate={false} />
          <p className="label mt-5 text-ink/60">
            {formatStampDate(stamp.date)}
            {stamp.location ? ` · ${stamp.location}` : ''}
          </p>
        </div>
      ) : (
        <p className="label mt-10 text-ink/50">
          {id ? "That stamp isn't in your collection." : 'No stamp chosen yet.'}
        </p>
      )}
    </div>
  )
}

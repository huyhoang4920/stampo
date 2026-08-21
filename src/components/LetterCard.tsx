import Stamp, { STAMP_H, STAMP_W } from './Stamp'

/** The letter's own details, as typed on the compose screen. */
export type LetterDetails = {
  sender: string
  receiver: string
  title: string
  message: string
  /** The stamp being sent — its artwork, date and place all show on the card. */
  stampImage?: string
  location: string
  date: string
}

/**
 * The slot the stamp sits in on the card. The stamp keeps its own proportions
 * and is sized to this height, so a stamp cut from any photo still fills the
 * slot without being squashed to the slot's shape.
 */
const STAMP_SLOT_H = 292
const STAMP_FIT_W = STAMP_SLOT_H * (STAMP_W / STAMP_H)

/**
 * The letter itself — live, not drawn. Everything on it comes from the stamp
 * being sent and what was typed on the compose screen, so the card in the
 * send-off is the letter the user actually wrote.
 */
export default function LetterCard({ details }: { details: LetterDetails }) {
  return (
    <div className="flex w-[339px] flex-col items-center gap-6 bg-[#F5DC68] px-6 pt-8 pb-6">
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ height: STAMP_SLOT_H }}
      >
        {details.stampImage && (
          <Stamp image={details.stampImage} animate={false} width={`${STAMP_FIT_W}px`} />
        )}
      </div>

      <div className="flex flex-1 flex-col items-start gap-2 self-stretch">
        <p className="self-stretch whitespace-pre-wrap font-headline text-[36px] leading-[34px] font-medium tracking-[-0.03em] text-[#030303]">
          {details.title}
        </p>
        <p className="mt-2 self-stretch text-[14px] leading-[18px] text-[#030303] line-clamp-3">
          {details.message}
        </p>
      </div>

      <div className="flex items-center gap-2 self-stretch">
        <p className="mt-2 flex-1 text-[16px] leading-5 text-[#030303]">{details.location}</p>
        {/*
          The date is the one handwritten note on an otherwise set card — its
          own face, falling back to the body face wherever it isn't installed.
        */}
        <p
          className="mt-2 flex-1 text-right text-[16px] leading-5 text-[#030303]"
          style={{ fontFamily: "'Patrick Hand', var(--font-display)" }}
        >
          {details.date}
        </p>
      </div>
    </div>
  )
}

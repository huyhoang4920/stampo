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
 * The card's own measurements. Exported because the film exporter has to draw
 * this same card onto a canvas — there's no way to read the live DOM back as
 * pixels — and the two have to agree on it or the saved sequence won't match
 * what was on screen.
 */
export const CARD_W = 339
export const CARD_PAD_X = 24
export const CARD_PAD_TOP = 32
export const CARD_PAD_BOTTOM = 24
export const CARD_GAP = 24
export const TITLE_SIZE = 36
export const TITLE_LEADING = 34
export const DESC_SIZE = 14
export const DESC_LEADING = 18
export const DESC_MAX_LINES = 3
export const META_SIZE = 16
export const META_LEADING = 20

/**
 * The slot the stamp sits in on the card. The stamp keeps its own proportions
 * and is sized to this height, so a stamp cut from any photo still fills the
 * slot without being squashed to the slot's shape.
 */
export const STAMP_SLOT_H = 292
const STAMP_FIT_W = STAMP_SLOT_H * (STAMP_W / STAMP_H)

/**
 * The letter itself — live, not drawn. Everything on it comes from the stamp
 * being sent and what was typed on the compose screen, so the card in the
 * send-off is the letter the user actually wrote.
 */
export default function LetterCard({ details }: { details: LetterDetails }) {
  return (
    <div className="flex flex-col items-center bg-[#F5DC68]" style={{ width: CARD_W, gap: CARD_GAP, paddingLeft: CARD_PAD_X, paddingRight: CARD_PAD_X, paddingTop: CARD_PAD_TOP, paddingBottom: CARD_PAD_BOTTOM }}>
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ height: STAMP_SLOT_H }}
      >
        {details.stampImage && (
          <Stamp image={details.stampImage} animate={false} width={`${STAMP_FIT_W}px`} />
        )}
      </div>

      <div className="flex flex-1 flex-col items-start gap-2 self-stretch">
        <p
          className="self-stretch whitespace-pre-wrap font-headline font-medium tracking-[-0.03em] text-[#030303]"
          style={{ fontSize: TITLE_SIZE, lineHeight: `${TITLE_LEADING}px` }}
        >
          {details.title}
        </p>
        <p
          className="mt-2 self-stretch text-[#030303] line-clamp-3"
          style={{ fontSize: DESC_SIZE, lineHeight: `${DESC_LEADING}px` }}
        >
          {details.message}
        </p>
      </div>

      <div className="flex items-center gap-2 self-stretch">
        <p
          className="mt-2 flex-1 text-[#030303]"
          style={{ fontSize: META_SIZE, lineHeight: `${META_LEADING}px` }}
        >
          {details.location}
        </p>
        {/*
          The date is the one handwritten note on an otherwise set card — its
          own face, falling back to the body face wherever it isn't installed.
        */}
        <p
          className="mt-2 flex-1 text-right text-[#030303]"
          style={{
            fontFamily: "'Patrick Hand', var(--font-display)",
            fontSize: META_SIZE,
            lineHeight: `${META_LEADING}px`,
          }}
        >
          {details.date}
        </p>
      </div>
    </div>
  )
}

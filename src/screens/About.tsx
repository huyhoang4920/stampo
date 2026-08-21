import { useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal'
import instructionTitle from '../assets/art/about-instruction-title.svg'
import stork from '../assets/art/about-stork.png'
import scallopTopSvg from '../assets/art/about-scallop-top.svg?raw'
import scallopBottomSvg from '../assets/art/about-scallop-bottom.svg?raw'
import swash from '../assets/art/about-swash.svg'
import iconTshirt from '../assets/art/about-icon-tshirt.svg'
import iconTote from '../assets/art/about-icon-tote.svg'
import iconArrow from '../assets/art/about-icon-arrow.svg'
import badge510 from '../assets/art/about-badge-5-10.svg'
import badge2030 from '../assets/art/about-badge-20-30.svg'
import badgeDone from '../assets/art/about-badge-done.svg'
import rotationCircle from '../assets/art/about-rotation-circle.svg'
import tshirtPhoto from '../assets/art/about-tshirt.png'

/** Small caption copy throughout this page — one size, always uppercase. */
const CAPTION = 'text-[14px] leading-4 uppercase text-ink'
/**
 * An option pill is always a single line, so its height — and with it the
 * offset of its centre — is a constant the connector can be built against.
 */
const PILL_HALF = 24
/** How far the connector reaches from its spine across to the pills. */
const STUB_W = 34
/** Option B sits one step further in than Option A, as drawn. */
const OPTION_B_INDENT = 32

/** The width this page was drawn on. */
const CANVAS_W = 440
/**
 * A drawn length, held to its drawn proportion of the canvas on anything
 * narrower and capped at the literal value once there's room for it. The step
 * headings need this: at their drawn sizes the number, its hairline and the
 * title together overrun a 375px phone, and scaling them together is what
 * keeps the hairline's relationship to the number intact instead of letting
 * the title collide with it.
 */
function drawn(px: number): string {
  return `min(${((px / CANVAS_W) * 100).toFixed(2)}vw, ${px}px)`
}

/**
 * A step's number and title. The hairline is anchored to the number itself
 * rather than to the row, so it always sweeps up out of the digit the way
 * it's drawn — wherever the row's centring happens to put that digit.
 */
function StepHeading({
  number,
  title,
  delay,
  className = '',
}: {
  number: string
  title: string
  delay?: number
  className?: string
}) {
  return (
    <Reveal
      delay={delay}
      className={`flex items-center justify-center ${className}`}
      style={{ gap: drawn(48) }}
    >
      <span
        className="relative shrink-0 font-headline leading-none tracking-[-0.03em] text-ink"
        style={{ fontSize: drawn(72) }}
      >
        {number}
        {/*
          Anchored to the number rather than to the row, so it always sweeps
          up out of the digit — wherever the row's centring puts that digit —
          and costs no layout width of its own on the way.
        */}
        {/*
          `max-w-none` matters: this is positioned against the number, so the
          default `max-width: 100%` would otherwise clamp the hairline to the
          width of a single digit.
        */}
        <img
          src={swash}
          alt=""
          className="pointer-events-none absolute top-1/2 max-w-none -translate-y-1/2"
          style={{ left: `calc(-1 * ${drawn(8)})`, width: drawn(87) }}
        />
      </span>
      <h2
        className="whitespace-pre-line font-headline leading-[1.25] font-semibold tracking-[-0.03em] text-ink"
        style={{ fontSize: drawn(32) }}
      >
        {title}
      </h2>
    </Reveal>
  )
}

/**
 * One style option: its label, pill and caption, plus the connector stub that
 * branches out of the shared spine. Rendered as `display: contents` so all of
 * it lands directly in the parent grid — that grid is what keeps the stub on
 * the pill's centre line and the two options' columns in step.
 */
function StyleOption({
  letter,
  title,
  caption,
  badge,
  badgeAlt,
  row,
  indent = 0,
  spaceBefore,
}: {
  letter: string
  title: string
  caption: string
  badge: string
  badgeAlt: string
  /** Grid row the label sits on; the pill and caption follow it. */
  row: number
  indent?: number
  /** Air above this option, on top of the grid's own row gap. */
  spaceBefore?: number
}) {
  return (
    <div style={{ display: 'contents' }}>
      <div
        className="flex items-center"
        style={{ gridRow: row, gridColumn: 2, marginLeft: indent, marginTop: spaceBefore }}
      >
        <svg viewBox="0 0 22 22" className="h-[22px] w-[22px] shrink-0" aria-hidden>
          <circle cx="11" cy="11" r="11" fill="#EFE9DE" />
        </svg>
        <p className={`${CAPTION} -ml-3.5`}>{`Option ${letter}`}</p>
      </div>

      {/*
        The stub. It's a grid cell rather than a floating line, so the grid's
        own `items-center` is what lands it exactly on the pill's centre —
        no offset to keep in sync with the pill's height by hand.
      */}
      <div
        className="h-px bg-ink"
        style={{ gridRow: row + 1, gridColumn: 1, width: `calc(100% + ${indent}px)` }}
      />

      <div
        className="relative w-fit justify-self-start"
        style={{ gridRow: row + 1, gridColumn: 2, marginLeft: indent }}
      >
        <div className="rounded-full border border-ink bg-cornflower px-4 py-2">
          <p className="font-headline text-2xl leading-[30px] font-semibold tracking-[-0.03em] text-ink">
            {title}
          </p>
        </div>
        {/* Straddles the pill's top-right corner, as drawn. */}
        <img
          src={badge}
          alt={badgeAlt}
          className="pointer-events-none absolute h-18 w-18"
          style={{ left: 'calc(100% - 32px)', top: -50 }}
        />
      </div>

      <p
        className={`${CAPTION} whitespace-pre-line`}
        style={{ gridRow: row + 2, gridColumn: 2, marginLeft: indent }}
      >
        {caption}
      </p>
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-cream">
      <div className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="label w-fit rounded-full border-[0.5px] border-ink px-4 py-2 text-ink"
        >
          ← BACK
        </button>

        {/* Title: the wordmark art, with the stork mascot perched over its tail. */}
        <Reveal className="relative mt-6 w-full" style={{ aspectRatio: '392 / 213' }}>
          <img src={instructionTitle} alt="Instruction" className="absolute inset-x-0 top-0 w-full" />
          <img
            src={stork}
            alt=""
            className="absolute"
            style={{ left: '63.5%', top: '31.7%', width: '35%', height: '71.8%' }}
          />
        </Reveal>

        {/* Step 1 */}
        <StepHeading number="1" title="Pick your items" delay={80} className="mt-10" />

        <Reveal delay={160} className="mt-8 flex flex-wrap items-end justify-center gap-x-3 gap-y-5">
          <div className="flex flex-col items-center gap-2">
            <p className={`${CAPTION} text-center`}>Choose your product</p>
            <div className="mt-1 flex items-end justify-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <img src={iconTshirt} alt="" className="h-[27px] w-7" />
                <p className={CAPTION}>T-Shirt</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <img src={iconTote} alt="" className="h-[30px] w-[23px]" />
                <p className={CAPTION}>Tote bag</p>
              </div>
            </div>
          </div>

          <img src={iconArrow} alt="" className="mb-4 h-6 w-6" />
          <p className={`${CAPTION} w-17 whitespace-pre-wrap text-center`}>{'Pick\na color'}</p>

          <img src={iconArrow} alt="" className="mb-4 h-6 w-6" />
          <p className={`${CAPTION} whitespace-pre-wrap text-center`}>{'Pick\nyour size'}</p>
        </Reveal>
      </div>

      {/* Top edge of the "choose your style" band — a scalloped tear, not a straight line. */}
      <div
        className="h-14 w-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: scallopTopSvg }}
      />

      {/* Step 2 */}
      <div className="bg-gold px-6 pb-8">
        <StepHeading number="2" title="Choose your style" className="py-2" />

        {/*
          Both options on one grid: column 1 carries the connector, column 2
          the content. That's what keeps each stub on its pill's centre line
          and both options' columns in step with each other.
        */}
        <Reveal delay={100} className="mt-8">
          {/*
            Sized to its content and centred as one block, so the connector and
            the pills it feeds sit in the middle of the page together — laying
            the grid out full-width would pin the spine to the left margin.
          */}
          <div
            className="mx-auto grid w-fit items-center gap-y-2"
            style={{ gridTemplateColumns: `${STUB_W}px max-content` }}
          >
            {/*
              The spine. Spanning to the end of the last pill's row and then
              pulled back up by half a pill stops it exactly on that pill's
              centre, where its own stub branches off.
            */}
            <div
              className="w-px justify-self-start self-stretch bg-ink"
              style={{ gridArea: '1 / 1 / 6 / 2', marginBottom: PILL_HALF }}
            />

            <StyleOption
              letter="A"
              title="ready-made patch"
              caption={'Pick from our patch collection\nIcons, symbols or letter stamps'}
              badge={badge510}
              badgeAlt="Takes 5 to 10 minutes"
              row={1}
            />

            <StyleOption
              letter="B"
              title="custom print"
              caption={'Choose a design template\nAdd your name\nPrinted fresh for you'}
              badge={badge2030}
              badgeAlt="Takes 20 to 30 minutes"
              row={4}
              indent={OPTION_B_INDENT}
              spaceBefore={24}
            />
          </div>
        </Reveal>
      </div>

      {/* Bottom edge of the band, tearing back into the cream ground. */}
      <div
        className="h-17 w-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: scallopBottomSvg }}
      />

      {/* Step 3 */}
      <div className="px-6 pb-16">
        <StepHeading number="3" title={'Watch it\ncome to life!'} />

        <Reveal delay={100} className="mt-8 flex items-start justify-center gap-8">
          <p className={`${CAPTION} w-[190px] whitespace-pre-line`}>
            {'We press your design\nright in front of you\n\nYour one-of-a-kind piece'}
          </p>
          <img src={badgeDone} alt="Done!" className="mt-1 h-17 w-17 shrink-0" />
        </Reveal>

        <Reveal delay={220} className="relative mx-auto mt-8 h-[322px] w-[322px]">
          <img
            src={rotationCircle}
            alt=""
            className="absolute inset-0 h-full w-full animate-[spin_18s_linear_infinite]"
          />
          {/*
            Nudged right of centre on purpose: the shirt is drawn left of the
            middle of its own file, so centring the image box leaves the shirt
            itself looking off inside the ring. Not selectable or draggable —
            it's part of the illustration, not content to pick up.
          */}
          <img
            src={tshirtPhoto}
            alt="A t-shirt printed with your stamp design"
            draggable={false}
            className="absolute top-1/2 left-[calc(50%+10px)] w-[62%] -translate-x-1/2 -translate-y-1/2 select-none"
          />
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-10 max-w-[334px] text-center">
          <p className="font-headline text-[32px] leading-10 font-semibold tracking-[-0.03em] text-post-red-deep">
            Purchase it at Stampo!
          </p>
        </Reveal>
      </div>
    </div>
  )
}

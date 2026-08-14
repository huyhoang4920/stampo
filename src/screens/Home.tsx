import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import Stage from '../components/Stage'
import PillButton from '../components/PillButton'
import logo from '../assets/art/logo.svg'
import mailboxWhite from '../assets/art/mailbox-white.svg'
import mailboxYellow from '../assets/art/mailbox-yellow.svg'
import mailboxBlue from '../assets/art/mailbox-blue.svg'
import mailboxRed from '../assets/art/mailbox-red.svg'
import pillYellow from '../assets/art/pill-yellow.svg'
import pillBlue from '../assets/art/pill-blue.svg'
import pillRed from '../assets/art/pill-red.svg'
import stamp from '../assets/art/stamp-a.svg'

/**
 * Entrance choreography, in the order the postboxes arrive. Each one travels a
 * different distance — the box furthest back moves least, the one nearest the
 * viewer moves most, so the row arrives with some depth to it rather than as one
 * sliding sheet. Same duration throughout, so a longer trip also reads faster.
 */
const RISE = 'animate-[rise-in_1s_linear_both]'
/**
 * Long travel so the boxes read as rising into place rather than snapping to
 * it — each starts low enough that a good part of it is still below the frame.
 * Offsets stay small: a box sitting still through its delay is a dead frame.
 */
const ENTRANCE = {
  white: { delay: '0ms', from: '80px' },
  blue: { delay: '70ms', from: '120px' },
  yellow: { delay: '140ms', from: '150px' },
  red: { delay: '210ms', from: '190px' },
} as const
/** The wordmark leads the entrance — it starts the moment the page loads. */
const LOGO_DELAY = '0ms'

/** Per-box animation delay plus the distance its keyframe starts from. */
function rise({ delay, from }: { delay: string; from: string }): CSSProperties {
  return { animationDelay: delay, '--rise-from': from } as CSSProperties
}

/**
 * Slack around the stamps' clip strip. Its bottom edge stays on the button's
 * top edge; these pad the other three sides so nothing gets cropped.
 */
const STAMP_CLIP = { x: 40, top: 80 } as const

export default function Home() {
  const navigate = useNavigate()

  return (
    <Stage>
      {/* Wordmark */}
      <img
        data-art
        src={logo}
        alt="Stampo"
        className="absolute top-[107px] left-12 w-[343px] animate-[slide-up-in_0.85s_var(--ease-out-soft)_both]"
        style={{ animationDelay: LOGO_DELAY }}
      />

      {/* Back of the row: the tall white postbox */}
      <img
        data-art
        src={mailboxWhite}
        alt=""
        className={`absolute top-[294px] left-[157px] w-[219px] ${RISE}`}
        style={rise(ENTRANCE.white)}
      />

      {/* Yellow postbox — your collection */}
      <div
        className={`absolute top-[431px] left-[232px] h-[554px] w-[220px] ${RISE}`}
        style={rise(ENTRANCE.yellow)}
      >
        <img data-art src={mailboxYellow} alt="" className="absolute top-[26px] left-0 w-[220px]" />
        <PillButton
          art={pillYellow}
          label={'YOUR\nCOLLECTION'}
          width={140}
          height={58.34}
          className="top-0 left-[31px]"
          onClick={() => navigate('/collection')}
        />
      </div>

      {/* Blue postbox — about */}
      <div
        className={`absolute top-[385px] left-[-58px] h-[611px] w-[211px] ${RISE}`}
        style={rise(ENTRANCE.blue)}
      >
        <img data-art src={mailboxBlue} alt="" className="absolute top-[27px] left-0 w-[211px]" />
        <PillButton
          art={pillBlue}
          label="ABOUT"
          width={131}
          height={57}
          className="top-0 left-[75px]"
          onClick={() => navigate('/about')}
        />
      </div>

      {/* Red postbox — send a letter */}
      <div
        className={`absolute top-[560px] left-[21px] h-[441px] w-[195px] ${RISE}`}
        style={rise(ENTRANCE.red)}
      >
        <img data-art src={mailboxRed} alt="" className="absolute inset-0 w-[195px]" />
        <PillButton
          art={pillRed}
          label="SEND A LETTER"
          width={139}
          height={41}
          className="top-[15px] left-px"
          onClick={() => navigate('/send')}
        />
      </div>

      {/* Primary action */}
      <div className="absolute top-[754px] left-1/2 h-[89px] w-[190px] -translate-x-1/2">
        {/*
          Stamps spring up from behind the button and drop back down out of
          sight. Only the bottom edge of this strip clips — it sits on the
          button's top edge so the stamps can hide completely. Left, right and
          top are padded out well past the artwork so neither the tilt nor the
          spring's overshoot gets cut.
        */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: 55 - STAMP_CLIP.x,
            width: 79 + STAMP_CLIP.x * 2,
            top: -STAMP_CLIP.top,
            height: STAMP_CLIP.top + 36,
          }}
        >
          <StampPeek
            offset={`${STAMP_CLIP.x - 6}px ${STAMP_CLIP.top + 11}px`}
            tilt="-10.79deg"
            delay="900ms"
          />
          <StampPeek
            offset={`${STAMP_CLIP.x + 40}px ${STAMP_CLIP.top + 3}px`}
            tilt="12.04deg"
            delay="1150ms"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/capture')}
          aria-label="Make your stamp"
          className="absolute top-9 left-0 flex w-[190px] flex-col items-start overflow-hidden rounded-full border-[0.5px] border-ink bg-sun p-0.5 transition-transform duration-150 active:scale-[0.98]"
        >
          <span className="label flex h-12 w-[185px] items-center justify-center rounded-full bg-post-red-deep text-white">
            MAKE YOUR STAMP
          </span>
        </button>
      </div>
    </Stage>
  )
}

/**
 * One stamp. The wrapper holds the drawn tilt and position so the looping
 * animation is free to own `transform` on the artwork itself.
 */
function StampPeek({
  offset,
  tilt,
  delay,
}: {
  offset: string
  tilt: string
  delay: string
}) {
  return (
    <div
      className="absolute top-0 left-0 origin-top-left"
      style={{ translate: offset, rotate: tilt }}
    >
      {/* `both` fill keeps the stamp hidden behind the button during its delay. */}
      <img
        data-art
        data-stamp-peek
        src={stamp}
        alt=""
        className="w-[43px] animate-[stamp-peek_2.8s_linear_infinite_both]"
        style={{ animationDelay: delay }}
      />
    </div>
  )
}

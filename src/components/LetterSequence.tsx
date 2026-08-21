import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import LetterCard, { type LetterDetails } from './LetterCard'
import {
  LETTER_FRAMES,
  MAILBOX,
  MAILBOX_H,
  MAILBOX_W,
  SCENE_H,
  SCENE_W,
  STAGE_H,
  STAGE_W,
} from '../assets/art/letterFrames'

/** Every frame is held for the same beat. */
export const FRAME_MS = 500

type LetterSequenceProps = {
  details: LetterDetails
  /** Fires once the last frame has been held for its full beat. */
  onDone?: () => void
  className?: string
}

/**
 * The send-off, played as stop motion: seven drawings, each held half a second
 * and cut to the next. The mailbox never moves; the envelope is redrawn each
 * frame, and the letter rides out of it.
 *
 * Everything inside is authored at the artwork's own 440x956 scale and the
 * whole scene is scaled once — so the card's type, the envelope's offsets and
 * the turns it takes all stay in proportion to each other at any size, which
 * per-element percentages could not do. The red is this screen's own ground
 * rather than part of a drawing, so it reaches every edge on its own and the
 * mailbox can be fitted whole instead of cropped to cover the corners.
 */
export default function LetterSequence({ details, onDone, className = '' }: LetterSequenceProps) {
  const [frame, setFrame] = useState(0)
  const [scale, setScale] = useState(0)
  const boxRef = useRef<HTMLDivElement | null>(null)
  /**
   * Held in a ref so an inline callback from the caller can't restart the
   * timer below on every render — which would stall the sequence on frame 1.
   */
  const doneRef = useRef(onDone)
  useEffect(() => {
    doneRef.current = onDone
  }, [onDone])

  // Measured rather than computed in CSS: the scene's px-authored innards need
  // one shared factor, and CSS can't turn a container's size into the unitless
  // number scale() takes. The larger of the two ratios is what covers the box
  // — the smaller would letterbox the mailbox and leave the page showing.
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const fit = () =>
      setScale(Math.min(el.clientWidth / SCENE_W, el.clientHeight / SCENE_H))
    fit()

    // The observer catches the box changing for layout reasons; the viewport
    // listeners catch a turn of the phone. Both are needed: an observer's
    // callbacks are delivered on a frame boundary, so one alone leaves the
    // scene at the old scale for any stretch where the page isn't painting.
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    window.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('resize', fit)
    }
  }, [])

  useEffect(() => {
    const last = frame >= LETTER_FRAMES.length - 1
    const id = window.setTimeout(() => {
      if (last) doneRef.current?.()
      else setFrame((f) => f + 1)
    }, FRAME_MS)
    return () => clearTimeout(id)
  }, [frame])

  const { layers, letter } = LETTER_FRAMES[frame]

  // The card is drawn in among the envelope's own layers — behind its front
  // while the letter is still inside, in front of it once it's out.
  const stack: React.ReactNode[] = layers.map((src, i) => (
    <img key={`layer-${i}`} src={src} alt="" className="absolute inset-0 max-w-none" />
  ))
  if (letter) {
    stack.splice(
      letter.index,
      0,
      <div
        key="letter"
        className="absolute top-0 left-0 origin-top-left overflow-clip"
        style={{ rotate: letter.rotate, translate: letter.translate, height: letter.height }}
      >
        <LetterCard details={details} />
      </div>,
    )
  }

  return (
    <div ref={boxRef} className={`relative overflow-hidden bg-post-red ${className}`}>
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: SCENE_W,
          height: SCENE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* The mailbox: one drawing, centred, never moving. */}
        <img
          src={MAILBOX}
          alt=""
          className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
          style={{ width: MAILBOX_W, height: MAILBOX_H }}
        />

        {/*
          Nothing here transitions, deliberately. Stop motion is a cut between
          held drawings — tweening between them would read as the wrong medium.
        */}
        <div
          className="absolute"
          style={{
            width: STAGE_W,
            height: STAGE_H,
            left: (SCENE_W - STAGE_W) / 2,
            top: (SCENE_H - STAGE_H) / 2,
          }}
        >
          {stack}

          {/*
            The address is written on the envelope, so it sits above every
            layer and stays put while the letter moves.
          */}
          <div
            className="absolute flex flex-col items-start"
            style={{ left: 'calc(50% + 4.315px)', bottom: 10.935, translate: '-50%' }}
          >
            <p className="w-fit text-[24px] leading-[30px] text-[#030303]">
              {`From: ${details.sender}`}
            </p>
            <p className="w-fit text-[24px] leading-[30px] text-[#030303]">
              {`To: ${details.receiver}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

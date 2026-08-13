import type { Ref } from 'react'
import ringWhite from '../assets/art/capture-ring-white.svg'
import frameRed from '../assets/art/capture-frame-red.svg'
import frameYellow from '../assets/art/capture-frame-yellow.svg'

/** The cutter tool's outer body, authored at these exact proportions. */
const CUTTER_W = 261
const CUTTER_H = 367.72

/** The plain rectangular window the decorative rings are cut to reveal. */
const CUTTER_WINDOW = { left: 61, top: 78, width: 142, height: 205 }

/**
 * Punch animation delays: white pops first, then red and yellow squeeze in
 * together on the same beat (not staggered against each other).
 */
const PUNCH_DELAY_MS = { white: 0, outer: 70 } as const
const PUNCH_DURATION_MS = 420

/** Full staggered sequence length — Capture.tsx times its next step off this. */
export const PUNCH_MS = PUNCH_DELAY_MS.outer + PUNCH_DURATION_MS

type CaptureFrameProps = {
  /** The DOM node marking the window, so its live on-screen rect can be read at shutter time. */
  windowRef: Ref<HTMLDivElement>
  /**
   * Bump this to replay the cutter punch — a new value remounts the rings so
   * the CSS animation restarts even if the previous run just finished.
   */
  punchKey: number
}

/**
 * The postage-stamp cutter tool: its yellow body with side grips holds the
 * red and white rings that frame the shot. Renders no video of its own — the
 * window is a true cutout onto whatever sits behind it (the live feed in
 * Capture.tsx), dimmed everywhere else via a spotlight shadow. Pressing the
 * shutter plays the "cutter punch" here — white pops out, red and yellow
 * squeeze in around it — after which Capture.tsx takes over for the landing
 * transition (see the `Stamp` component and the curtain sweep there).
 */
export default function CaptureFrame({ windowRef, punchKey }: CaptureFrameProps) {
  const punching = punchKey > 0

  return (
    <div className="relative" style={{ width: CUTTER_W, height: CUTTER_H }}>
      {/*
        A "spotlight": this box is fully transparent, but its shadow spreads
        far enough to blanket the whole screen, dimming everything except the
        clear rect the shadow doesn't touch — the window itself.
      */}
      <div
        ref={windowRef}
        className="absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
        style={{ ...CUTTER_WINDOW }}
      />

      <img
        key={`white-${punchKey}`}
        data-art
        src={ringWhite}
        alt=""
        className={`absolute ${punching ? 'animate-[cutter-punch-out_0.42s_linear_both]' : ''}`}
        style={{
          left: 31,
          top: 37.34,
          width: 202,
          height: 278.06,
          animationDelay: `${PUNCH_DELAY_MS.white}ms`,
        }}
      />
      <img
        key={`red-${punchKey}`}
        data-art
        src={frameRed}
        alt=""
        className={`absolute ${punching ? 'animate-[cutter-punch-in_0.42s_linear_both]' : ''}`}
        style={{
          left: 30,
          top: 28.32,
          width: 201,
          height: 300.07,
          animationDelay: `${PUNCH_DELAY_MS.outer}ms`,
        }}
      />
      <img
        key={`yellow-${punchKey}`}
        data-art
        src={frameYellow}
        alt=""
        className={`absolute ${punching ? 'animate-[cutter-punch-in_0.42s_linear_both]' : ''}`}
        style={{
          left: 0,
          top: 0,
          width: CUTTER_W,
          height: CUTTER_H,
          animationDelay: `${PUNCH_DELAY_MS.outer}ms`,
        }}
      />
    </div>
  )
}

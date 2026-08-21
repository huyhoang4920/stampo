import mailbox from './letter/mailbox.svg'

import f1back from './letter/f1-back.svg'
import f1mid from './letter/f1-mid.svg'
import f1top from './letter/f1-top.svg'
import f2back from './letter/f2-back.svg'
import f2mid from './letter/f2-mid.svg'
import f2top from './letter/f2-top.svg'
import f3back from './letter/f3-back.svg'
import f3mid from './letter/f3-mid.svg'
import f3top from './letter/f3-top.svg'
import f4back from './letter/f4-back.svg'
import f4mid from './letter/f4-mid.svg'
import f4top from './letter/f4-top.svg'
import f5back from './letter/f5-back.svg'
import f5mid from './letter/f5-mid.svg'
import f5top from './letter/f5-top.svg'
import f6back from './letter/f6-back.svg'
import f6mid from './letter/f6-mid.svg'
import f6top from './letter/f6-top.svg'
import f7back from './letter/f7-back.svg'
import f7mid from './letter/f7-mid.svg'
import f7top from './letter/f7-top.svg'

/** The mailbox the letter is posted into. Held still under every frame. */
export const MAILBOX = mailbox
/** Its own drawn size, centred on the canvas below. */
export const MAILBOX_W = 305
export const MAILBOX_H = 643.484

/**
 * The canvas the send-off is drawn on. The scene's red is a flat fill rather
 * than part of any drawing, so it's the page's own ground here — which is what
 * lets the screen be red edge to edge without the mailbox being cropped to
 * reach the corners.
 */
export const SCENE_W = 440
export const SCENE_H = 956
/** The envelope's own canvas, centred on the scene. */
export const STAGE_W = 372
export const STAGE_H = 396.25

/**
 * Where the letter sits in a frame's stack, and how it's turned there.
 *
 * `height` clips the card: in the early frames only the top of it has cleared
 * the envelope, so the rest is cut off rather than drawn small. The last two
 * frames leave it out — by then the whole card is out.
 */
type LetterPose = {
  /** Index in `layers` the card is drawn at — it starts behind the envelope's
   *  front and ends in front of it. */
  index: number
  rotate: string
  translate: string
  height?: number
}

export type LetterFrame = {
  /** Envelope art, bottom to top. */
  layers: string[]
  /** Absent on the frames where the letter hasn't appeared yet. */
  letter?: LetterPose
  /** Turns the whole envelope on the spot — the jostle before anything moves. */
  tilt?: string
}

/**
 * How far the card sits from where it was drawn.
 *
 * How low it can go is set by the From/To line written on the envelope: the
 * drawn position already left the card's bottom edge only a pixel clear of it,
 * so these keep a real gap instead. `DROP_END` is the resting frame; `DROP`
 * holds the frames before it a little higher, so the card still has somewhere
 * to settle on the last beat.
 */
const DROP = -25
const DROP_END = -11

/**
 * The seven drawings, in order. Layer order and the card's pose are taken
 * straight from the artwork — including that the stack itself is reordered
 * between frames, which is what carries the letter out of the envelope.
 */
export const LETTER_FRAMES: LetterFrame[] = [
  // Three beats of the envelope being jostled in the mailbox mouth before
  // anything comes out of it.
  { layers: [f1back, f1mid, f1top], tilt: '-2.5deg' },
  { layers: [f1back, f1mid, f1top], tilt: '2deg' },
  { layers: [f1back, f1mid, f1top], tilt: '-1deg' },

  { layers: [f1back, f1mid, f1top] },
  { layers: [f2back, f2mid, f2top] },
  {
    layers: [f3back, f3top, f3mid],
    letter: { index: 2, rotate: '355.72deg', translate: '8.774px 134.981px', height: 233 },
  },
  {
    layers: [f4top, f4back, f4mid],
    letter: { index: 2, rotate: '4.9deg', translate: '28px -5px', height: 281.46 },
  },
  {
    layers: [f5top, f5back, f5mid],
    letter: {
      index: 2,
      rotate: '1.94deg',
      translate: `34px ${-229 + DROP}px`,
      height: 525.31,
    },
  },
  {
    layers: [f6top, f6back, f6mid],
    letter: { index: 3, rotate: '354.66deg', translate: `-25.242px ${-241.587 + DROP}px` },
  },
  {
    layers: [f7top, f7back, f7mid],
    letter: { index: 3, rotate: '357.16deg', translate: `1.944px ${-237.944 + DROP}px` },
  },
  // Settles: the card drops the last of the way and comes to rest centred.
  {
    layers: [f7top, f7back, f7mid],
    letter: { index: 3, rotate: '357.16deg', translate: `1.944px ${-237.944 + DROP_END}px` },
  },
]

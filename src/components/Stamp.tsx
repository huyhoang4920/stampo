import stampFrame from '../assets/art/stamp-frame.svg'
import { CUTTER_WINDOW } from './CaptureFrame'

/**
 * Exposed so a screen that's about to show its first stamp can warm this
 * first. Otherwise the card's border arrives a beat after the photo does.
 */
export const STAMP_FRAME_SRC = stampFrame

/**
 * The card's shape. Width keeps the frame art's authored proportions; height
 * is derived from the cutter window's ratio rather than the art's own, so a
 * captured photo — cut to that window — always lands here at its native
 * ratio. Keeping the two in lockstep is what stops the result stamp
 * distorting mid-flight: the FLIP move in Capture.tsx scales this card
 * straight out of the window's rect, and that only reads as a clean grow
 * (not a squash-then-correct) when the window and the card agree on shape.
 */
export const STAMP_W = 166.911
export const STAMP_H = STAMP_W * (CUTTER_WINDOW.height / CUTTER_WINDOW.width)

/**
 * How far the photo sits inside the card's edge, and how big it is — as a
 * share of the card, so a stamp stays correct at any size. Width keeps the
 * margin measured off the reference design; height is capped shorter than
 * the card's own (window-matched) ratio would give, tuned by eye to 300:185,
 * so the photo always leaves a visible, even margin all round instead of
 * crowding the scalloped edge — object-cover trims a sliver off the top and
 * bottom of a captured photo to make room.
 */
const PHOTO_SIZE_X = 77
const PHOTO_DISPLAY_RATIO = 300 / 185 // height : width, the card's own ratio runs taller than this
const PHOTO_SIZE_Y = PHOTO_DISPLAY_RATIO * PHOTO_SIZE_X * (STAMP_W / STAMP_H)
const PHOTO_INSET_X = (100 - PHOTO_SIZE_X) / 2
const PHOTO_INSET_Y = (100 - PHOTO_SIZE_Y) / 2

type StampProps = {
  /** The photo to set on the card — a stamp is always frame + photo together. */
  image: string
  /** Plays the "dropped into place" pop the moment this mounts. Default on. */
  animate?: boolean
  /** Any CSS width; height follows from the card's aspect ratio. */
  width?: number | string
  className?: string
}

/**
 * A finished stamp: a plain rectangular photo laid on top of the perforated
 * card — the photo itself is never cut to the card's scalloped silhouette,
 * it just sits within its margin, same as a real stamp. Pure display, reused
 * wherever a captured photo needs to read as an actual stamp (the result
 * screen, the collection, later the send flow).
 *
 * For the live camera viewfinder — the red/white rings, yellow cutter
 * housing, dimming spotlight, and shutter-triggered punch — see CaptureFrame.
 */
export default function Stamp({
  image,
  animate = true,
  width = STAMP_W,
  className,
}: StampProps) {
  return (
    <div
      className={`relative ${className ?? ''}`}
      style={{ width, aspectRatio: `${STAMP_W} / ${STAMP_H}` }}
    >
      <img data-art src={stampFrame} alt="" className="absolute inset-0 h-full w-full" />

      <div
        className="absolute overflow-hidden"
        style={{
          left: `${PHOTO_INSET_X}%`,
          top: `${PHOTO_INSET_Y}%`,
          width: `${PHOTO_SIZE_X}%`,
          height: `${PHOTO_SIZE_Y}%`,
        }}
      >
        <img
          data-art
          src={image}
          alt=""
          className={`h-full w-full object-cover ${animate ? 'origin-center animate-[photo-place_0.4s_linear_both]' : ''}`}
        />
      </div>
    </div>
  )
}

import stampFrame from '../assets/art/stamp-frame.svg'

/** The stamp's perforated card, authored at these exact proportions. */
export const STAMP_W = 166.911
export const STAMP_H = 240.023

/**
 * Margin between the card's edge and the photo — measured off the reference
 * design, not derived from the frame art itself (the SVG has no separate
 * window shape; it's one solid perforated card, photo laid on top of it).
 */
const MARGIN_X = 19.2
const MARGIN_Y = 27.6

type StampProps = {
  /** The photo to set on the card — a stamp is always frame + photo together. */
  image: string
  /** Plays the "dropped into place" pop the moment this mounts. Default on. */
  animate?: boolean
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
export default function Stamp({ image, animate = true, className }: StampProps) {
  return (
    <div className={`relative ${className ?? ''}`} style={{ width: STAMP_W, height: STAMP_H }}>
      <img data-art src={stampFrame} alt="" className="absolute inset-0 h-full w-full" />

      <div
        className="absolute overflow-hidden"
        style={{
          left: MARGIN_X,
          top: MARGIN_Y,
          width: STAMP_W - MARGIN_X * 2,
          height: STAMP_H - MARGIN_Y * 2,
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

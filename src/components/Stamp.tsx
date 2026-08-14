import stampFrame from '../assets/art/stamp-frame.svg'

/**
 * Exposed so a screen that's about to show its first stamp can warm this
 * first. Otherwise the card's border arrives a beat after the photo does.
 */
export const STAMP_FRAME_SRC = stampFrame

/** The stamp's perforated card, authored at these exact proportions. */
export const STAMP_W = 166.911
export const STAMP_H = 240.023

/**
 * How far the photo sits inside the card's edge, as a share of the card —
 * measured off the reference design. A percentage rather than a pixel value
 * so a stamp stays correct at any size (the collection grid scales them down
 * to fit a column).
 */
const PHOTO_INSET = '11.5%'
const PHOTO_SIZE = '77%'

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
          left: PHOTO_INSET,
          top: PHOTO_INSET,
          width: PHOTO_SIZE,
          height: PHOTO_SIZE,
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

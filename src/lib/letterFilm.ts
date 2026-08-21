import {
  PHOTO_SIZE_X,
  PHOTO_SIZE_Y,
  STAMP_FRAME_SRC,
  STAMP_H,
  STAMP_W,
} from '../components/Stamp'
import type { LetterDetails } from '../components/LetterCard'
import {
  CARD_PAD_X,
  CARD_PAD_BOTTOM,
  CARD_PAD_TOP,
  CARD_GAP,
  CARD_W,
  DESC_LEADING,
  DESC_MAX_LINES,
  DESC_SIZE,
  META_LEADING,
  META_SIZE,
  STAMP_SLOT_H,
  TITLE_LEADING,
  TITLE_SIZE,
} from '../components/LetterCard'
import { FRAME_MS } from '../components/LetterSequence'
import {
  LETTER_FRAMES,
  MAILBOX,
  MAILBOX_H,
  MAILBOX_W,
  SCENE_H,
  SCENE_W,
  STAGE_DROP,
  STAGE_H,
  STAGE_W,
} from '../assets/art/letterFrames'

/** Rendered at twice the drawn size, so the saved film isn't soft. */
const SCALE = 2
/** The scene's ground — the same red the screen itself is painted with. */
const GROUND = '#D62828'
const CARD_BG = '#F5DC68'
const INK = '#030303'
/** The address written on the envelope. */
const ADDRESS_SIZE = 24
const ADDRESS_LEADING = 30
const ADDRESS_CENTRE_X = STAGE_W / 2 + 4.315
const ADDRESS_BOTTOM = 10.935

const BODY_FACE = "'Syne', system-ui, sans-serif"
const DISPLAY_FACE = "'Bricolage Grotesque', system-ui, sans-serif"
const HAND_FACE = `'Patrick Hand', ${BODY_FACE}`

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

/** Splits `text` into lines that fit `width`, honouring the breaks it already has. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (line && ctx.measureText(next).width > width) {
        lines.push(line)
        line = word
      } else {
        line = next
      }
    }
    lines.push(line)
  }
  return lines
}

/**
 * `object-fit: cover` as drawImage arguments — the source is cropped to the
 * destination's shape rather than squashed into it, same as the photo on a
 * stamp is on screen.
 */
function coverArgs(img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
  const sw = w / scale
  const sh = h / scale
  return [(img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh] as const
}

type CardText = { title: string[]; desc: string[] }

function measureCard(ctx: CanvasRenderingContext2D, details: LetterDetails): CardText & { height: number } {
  const inner = CARD_W - CARD_PAD_X * 2

  ctx.font = `500 ${TITLE_SIZE}px ${DISPLAY_FACE}`
  const title = wrap(ctx, details.title, inner)

  ctx.font = `400 ${DESC_SIZE}px ${BODY_FACE}`
  const desc = wrap(ctx, details.message, inner).slice(0, DESC_MAX_LINES)

  const titleH = title.length * TITLE_LEADING
  const descH = desc.length * DESC_LEADING
  // Mirrors the card's own stack: padding, stamp, gap, text block, gap, the
  // location/date row, padding.
  const height =
    CARD_PAD_TOP +
    STAMP_SLOT_H +
    CARD_GAP +
    (titleH + 16 + descH) +
    CARD_GAP +
    (8 + META_LEADING) +
    CARD_PAD_BOTTOM
  return { title, desc, height }
}

type Art = {
  mailbox: HTMLImageElement
  stampFrame: HTMLImageElement
  photo?: HTMLImageElement
  layers: Map<string, HTMLImageElement>
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  details: LetterDetails,
  art: Art,
  text: CardText,
  height: number,
) {
  ctx.fillStyle = CARD_BG
  ctx.fillRect(0, 0, CARD_W, height)

  // The stamp, centred across the card.
  const stampW = STAMP_SLOT_H * (STAMP_W / STAMP_H)
  const stampX = (CARD_W - stampW) / 2
  const stampY = CARD_PAD_TOP
  ctx.drawImage(art.stampFrame, stampX, stampY, stampW, STAMP_SLOT_H)
  if (art.photo) {
    // The very shares the live stamp insets its photo by, so the two agree.
    const photoW = stampW * (PHOTO_SIZE_X / 100)
    const photoH = STAMP_SLOT_H * (PHOTO_SIZE_Y / 100)
    const px = stampX + (stampW - photoW) / 2
    const py = stampY + (STAMP_SLOT_H - photoH) / 2
    ctx.drawImage(art.photo, ...coverArgs(art.photo, photoW, photoH), px, py, photoW, photoH)
  }

  const left = CARD_PAD_X
  let y = CARD_PAD_TOP + STAMP_SLOT_H + CARD_GAP

  ctx.fillStyle = INK
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'

  ctx.font = `500 ${TITLE_SIZE}px ${DISPLAY_FACE}`
  for (const line of text.title) {
    ctx.fillText(line, left, y + TITLE_LEADING * 0.78)
    y += TITLE_LEADING
  }

  y += 16
  ctx.font = `400 ${DESC_SIZE}px ${BODY_FACE}`
  for (const line of text.desc) {
    ctx.fillText(line, left, y + DESC_LEADING * 0.75)
    y += DESC_LEADING
  }

  y += CARD_GAP + 8
  ctx.font = `400 ${META_SIZE}px ${BODY_FACE}`
  ctx.fillText(details.location, left, y + META_LEADING * 0.75)
  ctx.font = `400 ${META_SIZE}px ${HAND_FACE}`
  ctx.textAlign = 'right'
  ctx.fillText(details.date, CARD_W - CARD_PAD_X, y + META_LEADING * 0.75)
  ctx.textAlign = 'left'
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  index: number,
  details: LetterDetails,
  art: Art,
  text: CardText,
  cardH: number,
) {
  const { layers, letter, tilt } = LETTER_FRAMES[index]

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0)
  ctx.fillStyle = GROUND
  ctx.fillRect(0, 0, SCENE_W, SCENE_H)

  ctx.drawImage(
    art.mailbox,
    (SCENE_W - MAILBOX_W) / 2,
    (SCENE_H - MAILBOX_H) / 2,
    MAILBOX_W,
    MAILBOX_H,
  )

  // Into the envelope's own frame of reference, turned if this beat is tilted.
  ctx.save()
  ctx.translate((SCENE_W - STAGE_W) / 2, (SCENE_H - STAGE_H) / 2 + STAGE_DROP)
  if (tilt) {
    ctx.translate(STAGE_W / 2, STAGE_H / 2)
    ctx.rotate((parseFloat(tilt) * Math.PI) / 180)
    ctx.translate(-STAGE_W / 2, -STAGE_H / 2)
  }

  const paintCard = () => {
    if (!letter) return
    const [tx, ty] = letter.translate.split(' ').map(parseFloat)
    ctx.save()
    if (letter.bottom === undefined) {
      // Still emerging: pinned by its top, turned about that same corner.
      ctx.translate(tx, ty)
      ctx.rotate((parseFloat(letter.rotate) * Math.PI) / 180)
      if (letter.height !== undefined) {
        ctx.beginPath()
        ctx.rect(0, 0, CARD_W, letter.height)
        ctx.clip()
      }
      drawCard(ctx, details, art, text, cardH)
    } else {
      // At rest: pinned by its bottom edge and turned about its middle.
      const top = STAGE_H - letter.bottom - cardH
      ctx.translate(tx + CARD_W / 2, top + cardH / 2)
      ctx.rotate((parseFloat(letter.rotate) * Math.PI) / 180)
      ctx.translate(-CARD_W / 2, -cardH / 2)
      drawCard(ctx, details, art, text, cardH)
    }
    ctx.restore()
  }

  // The card is drawn in among the envelope's layers, same order as on screen.
  layers.forEach((src, i) => {
    if (letter && letter.index === i) paintCard()
    const img = art.layers.get(src)
    if (img) ctx.drawImage(img, 0, 0, STAGE_W, STAGE_H)
  })
  if (letter && letter.index >= layers.length) paintCard()

  // The address, written on the envelope over everything else.
  ctx.font = `400 ${ADDRESS_SIZE}px ${BODY_FACE}`
  ctx.fillStyle = INK
  const lines = [`From: ${details.sender}`, `To: ${details.receiver}`]
  const blockW = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const blockLeft = ADDRESS_CENTRE_X - blockW / 2
  let ay = STAGE_H - ADDRESS_BOTTOM - ADDRESS_LEADING * 2
  for (const line of lines) {
    ctx.fillText(line, blockLeft, ay + ADDRESS_LEADING * 0.75)
    ay += ADDRESS_LEADING
  }

  ctx.restore()
}

/**
 * The recording formats to try, best first. MP4 leads because it's the one
 * that travels — it plays and shares anywhere. The WebM codecs are only a
 * fallback for browsers that can't record MP4 at all.
 */
const FORMATS = [
  'video/mp4;codecs=avc1.42E01E',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

export type Film = { blob: Blob; extension: string }

/**
 * Replays the sequence onto a canvas and records it, a frame at a time.
 *
 * Drawn rather than captured from the page: there's no way to read the live
 * DOM back as pixels, so the frames are painted again here from the same
 * artwork, frame data and measurements the screen uses.
 */
export async function recordFilm(
  details: LetterDetails,
  onFrame?: (index: number, total: number) => void,
): Promise<Film> {
  const mimeType = FORMATS.find((type) => MediaRecorder.isTypeSupported(type))
  if (!mimeType) throw new Error("This browser can't record video.")

  const canvas = document.createElement('canvas')
  canvas.width = SCENE_W * SCALE
  canvas.height = SCENE_H * SCALE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get a canvas to draw on.')

  // Every distinct layer once, rather than per frame — most are shared.
  const sources = new Set(LETTER_FRAMES.flatMap((f) => f.layers))
  const [mailbox, stampFrame, photo, ...layerImages] = await Promise.all([
    loadImage(MAILBOX),
    loadImage(STAMP_FRAME_SRC),
    details.stampImage ? loadImage(details.stampImage) : Promise.resolve(undefined),
    ...[...sources].map(loadImage),
  ])
  const art: Art = {
    mailbox: mailbox as HTMLImageElement,
    stampFrame: stampFrame as HTMLImageElement,
    photo: photo as HTMLImageElement | undefined,
    layers: new Map([...sources].map((src, i) => [src, layerImages[i] as HTMLImageElement])),
  }

  // The fonts have to be in before anything is measured, or the first frame is
  // laid out with a fallback face and the rest with the real one.
  await document.fonts.ready
  const { title, desc, height } = measureCard(ctx, details)

  const stream = canvas.captureStream(0)
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)

  const finished = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })
  recorder.start()

  for (let i = 0; i < LETTER_FRAMES.length; i++) {
    drawFrame(ctx, i, details, art, { title, desc }, height)
    track.requestFrame()
    onFrame?.(i + 1, LETTER_FRAMES.length)
    await new Promise((r) => setTimeout(r, FRAME_MS))
  }

  recorder.stop()
  track.stop()
  await finished

  return {
    blob: new Blob(chunks, { type: mimeType }),
    extension: mimeType.startsWith('video/mp4') ? 'mp4' : 'webm',
  }
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import CaptureFrame, { PUNCH_MS } from '../components/CaptureFrame'
import Stamp from '../components/Stamp'
import ModeToggle, { type CaptureMode } from '../components/ModeToggle'
import { useCamera } from '../lib/useCamera'
import { clearDraft, saveDraft } from '../lib/draft'
import { addStamp } from '../lib/collection'
import { todayISO } from '../lib/dates'

/** The stamp popping into existence at the capture spot. */
const APPEAR_MS = 320
/**
 * The stamp travelling up and the yellow ground rising — one shared beat, so
 * they start together and land together.
 */
const REVEAL_MS = 500

type Rect = { left: number; top: number; width: number; height: number }

/**
 * Sequence after the shutter fires. Each beat waits for the one before it, so
 * the whole thing reads as a single continuous move rather than a cut:
 *
 * 'live'      — camera view, cutter rings mid-punch.
 * 'appeared'  — the finished stamp pops into being at the capture spot, over
 *               the frozen frame. This is the same element that ends up on
 *               the result screen — it is never unmounted or replaced.
 * 'revealing' — that stamp travels up to its resting place while the yellow
 *               ground rolls up behind it, both starting on the same beat.
 * 'settled'   — heading and buttons fade in.
 */
type Phase = 'live' | 'appeared' | 'revealing' | 'settled'

export default function Capture() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<CaptureMode>('capture')
  const { status, attach, snapshot, snapshotRegion } = useCamera(mode === 'capture')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const windowRef = useRef<HTMLDivElement | null>(null)
  const carrierRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const timers = useRef<number[]>([])
  const capturedAtRef = useRef<Rect | null>(null)

  const [punchKey, setPunchKey] = useState(0)
  const [phase, setPhase] = useState<Phase>('live')
  const [croppedImage, setCroppedImage] = useState<string | undefined>()
  const [sourceImage, setSourceImage] = useState<string | undefined>()
  const [date, setDate] = useState(todayISO)
  const [location, setLocation] = useState('')
  // Hidden until the layout effect below has measured and offset the stamp
  // onto the capture spot. `visibility` rather than `opacity` because CSS
  // animations outrank inline styles, and the stamp's appear animation owns
  // opacity.
  const [carrierStyle, setCarrierStyle] = useState<CSSProperties>({ visibility: 'hidden' })

  const capturing = punchKey > 0
  const live = status === 'ready'

  // Clear any pending capture timers if the screen unmounts mid-sequence.
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // The stamp is rendered in its final resting place in the layout — so to
  // start it at the capture spot instead, measure both and offset it there.
  // Runs before paint, so the resting position is never shown.
  useLayoutEffect(() => {
    if (phase !== 'appeared' || !carrierRef.current) return

    const from = capturedAtRef.current
    if (!from) {
      setCarrierStyle({ visibility: 'visible' })
      return
    }

    const rest = carrierRef.current.getBoundingClientRect()
    const dx = from.left + from.width / 2 - (rest.left + rest.width / 2)
    const dy = from.top + from.height / 2 - (rest.top + rest.height / 2)
    setCarrierStyle({
      visibility: 'visible',
      transform: `translate(${dx}px, ${dy}px) scale(${from.width / rest.width}, ${from.height / rest.height})`,
      transformOrigin: 'center',
      transition: 'none',
    })
  }, [phase])

  // Releasing the offset is the move — same element, no remount, so the stamp
  // the user watched appear is literally the one that arrives.
  useEffect(() => {
    if (phase !== 'revealing') return
    setCarrierStyle({
      visibility: 'visible',
      transform: 'none',
      transformOrigin: 'center',
      transition: `transform ${REVEAL_MS}ms var(--ease-out-soft)`,
    })
  }, [phase])

  function handleShutter() {
    const video = videoRef.current
    const windowEl = windowRef.current
    if (!video || !windowEl || capturing) return

    // The full photo, kept so the stamp can be re-cropped later, plus the
    // crop that matches exactly what was visible in the viewfinder window —
    // that's the part that becomes the stamp.
    const source = snapshot(video)
    const windowRect = windowEl.getBoundingClientRect()
    const cropped = snapshotRegion(video, windowRect)
    if (!source || !cropped) return

    // Left paused, not hidden: the frozen frame stays on screen underneath so
    // the stamp appears over the shot it came from rather than over black.
    // Left paused, not hidden: the frozen frame stays on screen underneath so
    // the stamp appears over the shot it came from rather than over black.
    video.pause()
    saveDraft({ source, cropped })
    setPunchKey((n) => n + 1)
    capturedAtRef.current = {
      left: windowRect.left,
      top: windowRect.top,
      width: windowRect.width,
      height: windowRect.height,
    }
    beginResult(cropped, source, PUNCH_MS)
  }

  /**
   * Runs the appear → move + curtain → settle sequence. `appearAt` gives the
   * cutter punch time to finish when there was one; an uploaded photo has no
   * punch to wait for, and no capture spot to fly up from, so its stamp
   * simply appears in place (see the layout effect's null-rect fallback).
   */
  function beginResult(stampImage: string, fullPhoto: string, appearAt: number) {
    const revealAt = appearAt + APPEAR_MS
    timers.current.push(
      window.setTimeout(() => {
        setCroppedImage(stampImage)
        setSourceImage(fullPhoto)
        setPhase('appeared')
      }, appearAt),
      window.setTimeout(() => setPhase('revealing'), revealAt),
      window.setTimeout(() => setPhase('settled'), revealAt + REVEAL_MS),
    )
  }

  function handleRetake() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('live')
    setCroppedImage(undefined)
    setSourceImage(undefined)
    setPunchKey(0)
    setCarrierStyle({ visibility: 'hidden' })
    setLocation('')
    setDate(todayISO())
    capturedAtRef.current = null
    videoRef.current?.play().catch(() => {})
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // An uploaded photo has no viewfinder window to crop against, so the
        // whole photo becomes the stamp's image and the card's own window
        // frames it. A proper crop step is future work for the cutter design.
        saveDraft({ source: reader.result })
        capturedAtRef.current = null
        beginResult(reader.result, reader.result, 0)
      }
    }
    reader.readAsDataURL(file)
  }

  /** Files the stamp, then hands off to wherever the chosen action leads. */
  function fileStamp() {
    if (!croppedImage) return null
    const saved = addStamp({
      image: croppedImage,
      source: sourceImage,
      date,
      location: location.trim(),
    })
    clearDraft()
    return saved
  }

  function handleSaveToCollection() {
    if (fileStamp()) navigate('/collection')
  }

  function handleSendLetter() {
    // Filed first either way — a stamp you just made shouldn't be able to
    // vanish because the letter flow was abandoned halfway.
    const saved = fileStamp()
    if (saved) navigate(`/send?stamp=${saved.id}`)
  }

  const settled = phase === 'settled'
  // Same beat as the stamp's move, not after it.
  const curtainUp = phase === 'revealing' || phase === 'settled'

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-ink">
      {mode === 'capture' && (
        <video
          ref={(video) => {
            videoRef.current = video
            attach(video)
          }}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            live ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Back */}
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Back"
        className={`label absolute top-[max(1.25rem,env(safe-area-inset-top))] left-6 z-30 rounded-full border border-white/40 px-4 py-2 text-white transition-opacity duration-300 active:scale-95 ${
          capturing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        ← BACK
      </button>

      {mode === 'capture' ? (
        <div className="relative flex h-full w-full flex-col items-center justify-center">
          {/*
            The cutter exists only up through the punch. It hands off to the
            stamp itself, so the two are never on screen together — there is
            only ever one stamp in this sequence.
          */}
          {phase === 'live' && <CaptureFrame windowRef={windowRef} punchKey={punchKey} />}

          {!capturing && (status === 'denied' || status === 'unavailable') && (
            <p className="mt-6 max-w-[26ch] text-center text-[15px] leading-[21px] text-white/85">
              {status === 'denied'
                ? "Camera access is off — allow it in your browser's settings, or upload a photo instead."
                : "Couldn't reach a camera on this device — upload a photo instead."}
            </p>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-10 text-center">
          <p className="max-w-[24ch] text-[15px] leading-[21px] text-white/85">
            Choose a photo from your library to turn into a stamp.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="label mt-6 rounded-full bg-sun px-8 py-3 text-ink active:scale-95"
          >
            CHOOSE PHOTO
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Controls — fade out once a shot's been taken, so the result reads clearly. */}
      <div
        className={`absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-6 transition-opacity duration-300 ${
          capturing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {mode === 'capture' && (
          <button
            type="button"
            onClick={handleShutter}
            disabled={!live}
            aria-label="Take photo"
            className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white disabled:opacity-40"
          >
            <span className="h-[58px] w-[58px] rounded-full bg-white active:scale-90 transition-transform" />
          </button>
        )}
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {phase !== 'live' && croppedImage && (
        <div className="absolute inset-0 z-20 overflow-hidden">
          {/*
            Holds the frozen frame at the same brightness the viewfinder's own
            dimming gave it, so losing the cutter doesn't flash the screen.
            The curtain below paints over this when it rises.
          */}
          <div className="absolute inset-0 bg-black/55" />

          {/*
            Ground: waits below the viewport, then rises on the same beat as
            the stamp's move. 0.5s here is REVEAL_MS — kept literal because
            Tailwind can only generate classes it can see at build time.
          */}
          <div
            className={`absolute inset-0 bg-sun ${
              curtainUp ? 'animate-[curtain-up_0.5s_var(--ease-out-soft)_both]' : ''
            }`}
            style={!curtainUp ? { transform: 'translateY(100%)' } : undefined}
          />

          {/*
            Result layout. Everything sits in its final position from the
            first frame — the text and buttons only change opacity, so nothing
            reflows and the stamp's measured resting place stays honest.
            Ordered after the curtain so the stamp always paints above it.
          */}
          <div className="relative flex h-full flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={handleRetake}
              className={`label w-fit rounded-full border-[0.5px] border-ink px-4 py-2 transition-opacity duration-300 ${
                settled ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              ← RETAKE
            </button>

            {/*
              The stamp rests high on the screen, well above the centred spot
              it was cut at — that gap is what the move up actually travels.
              The carrier owns position (the move); the stamp inside owns
              scale (the appear pop). Splitting them keeps the two animations
              from overwriting each other's transform.
            */}
            <div ref={carrierRef} className="mx-auto mt-8 w-fit" style={carrierStyle}>
              <Stamp
                image={croppedImage}
                animate={false}
                className="animate-[stamp-appear_0.32s_linear_both]"
              />
            </div>

            <div
              className={`mt-8 transition-opacity duration-300 ${
                settled ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <label className="label block text-left text-ink/60" htmlFor="stamp-date">
                DATE
              </label>
              <input
                id="stamp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/25 bg-white/55 px-4 py-3 text-[16px] text-ink"
              />

              <label className="label mt-5 block text-left text-ink/60" htmlFor="stamp-location">
                LOCATION
              </label>
              <input
                id="stamp-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where did you find it?"
                className="mt-2 w-full rounded-xl border border-ink/25 bg-white/55 px-4 py-3 text-[16px] text-ink placeholder:text-ink/35"
              />
            </div>

            <div
              className={`mt-auto flex flex-col gap-3 pt-6 transition-opacity duration-300 ${
                settled ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <button
                type="button"
                onClick={handleSaveToCollection}
                className="label w-full rounded-full bg-post-red-deep py-4 text-white active:scale-[0.98]"
              >
                SAVE TO COLLECTION
              </button>
              <button
                type="button"
                onClick={handleSendLetter}
                className="label w-full rounded-full border-[0.5px] border-ink py-4 text-ink active:scale-[0.98]"
              >
                SEND A LETTER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

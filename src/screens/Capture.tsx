import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import CaptureFrame, { PUNCH_MS, type CutterSize } from '../components/CaptureFrame'
import Stamp, { STAMP_FRAME_SRC } from '../components/Stamp'
import ModeToggle, { type CaptureMode } from '../components/ModeToggle'
import SizeToggle from '../components/SizeToggle'
import { useCamera } from '../lib/useCamera'
import UploadCropper from '../components/UploadCropper'
import { addStamp } from '../lib/collection'
import { todayISO } from '../lib/dates'
import { capImageSize, cropImageRegion, decodeImage, sleep } from '../lib/images'

/** The stamp popping into existence at the capture spot. */
const APPEAR_MS = 400
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
  /** 3 is the size the cutter art was drawn at; 1 and 2 crop wider. */
  const [cutterSize, setCutterSize] = useState<CutterSize>(3)
  const { status, mirrored, attach, flip, focusAt, snapshotRegion } = useCamera(mode === 'capture')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const uploadImgRef = useRef<HTMLImageElement | null>(null)
  const windowRef = useRef<HTMLDivElement | null>(null)
  const carrierRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const timers = useRef<number[]>([])
  const capturedAtRef = useRef<Rect | null>(null)
  /** Bumped to abandon an in-flight result sequence (retake, or unmount). */
  const runIdRef = useRef(0)

  const [punchKey, setPunchKey] = useState(0)
  const [phase, setPhase] = useState<Phase>('live')
  const [croppedImage, setCroppedImage] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  /** The chosen photo, held while the cutter is positioned over it. */
  const [uploadedImage, setUploadedImage] = useState<string | undefined>()
  const [date, setDate] = useState(todayISO)
  const [location, setLocation] = useState('')
  // Hidden until the layout effect below has measured and offset the stamp
  // onto the capture spot. `visibility` rather than `opacity` because CSS
  // animations outrank inline styles, and the stamp's appear animation owns
  // opacity.
  const [carrierStyle, setCarrierStyle] = useState<CSSProperties>({ visibility: 'hidden' })

  const capturing = punchKey > 0
  const live = status === 'ready'

  // The card's border is needed the instant the stamp appears, and it has
  // never been requested before that point on a cold load — so fetch and
  // decode it now, while the camera or the photo is still being framed.
  useEffect(() => {
    void decodeImage(STAMP_FRAME_SRC)
  }, [])

  // Abandon anything in flight if the screen unmounts mid-sequence.
  useEffect(
    () => () => {
      runIdRef.current += 1
      timers.current.forEach(clearTimeout)
    },
    [],
  )

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

  /** One button for both modes: shoot the camera, or cut the uploaded photo. */
  function handleShutter() {
    if (capturing) return
    if (mode === 'upload') {
      cutFromUpload()
      return
    }
    captureFromCamera()
  }

  /**
   * Cuts whatever the cutter is framing out of the uploaded photo, then runs
   * the identical sequence a camera shot does — punch, stamp, curtain, form.
   */
  function cutFromUpload() {
    const img = uploadImgRef.current
    const windowEl = windowRef.current
    if (!img || !windowEl || !uploadedImage) return

    const windowRect = windowEl.getBoundingClientRect()
    const cropped = cropImageRegion(img, windowRect)
    if (!cropped) return

    setPunchKey((n) => n + 1)
    capturedAtRef.current = {
      left: windowRect.left,
      top: windowRect.top,
      width: windowRect.width,
      height: windowRect.height,
    }
    void runResultSequence(cropped, PUNCH_MS)
  }

  function captureFromCamera() {
    const video = videoRef.current
    const windowEl = windowRef.current
    if (!video || !windowEl) return

    // Only the cut is encoded. The full frame used to be kept alongside it for
    // a future re-crop, but nothing read it and it ran to megabytes as a data
    // URL — enough to exhaust the storage an origin gets and break saving.
    const windowRect = windowEl.getBoundingClientRect()
    const cropped = snapshotRegion(video, windowRect)
    if (!cropped) return

    // Left paused, not hidden: the frozen frame stays on screen underneath so
    // the stamp appears over the shot it came from rather than over black.
    video.pause()
    setPunchKey((n) => n + 1)
    capturedAtRef.current = {
      left: windowRect.left,
      top: windowRect.top,
      width: windowRect.width,
      height: windowRect.height,
    }
    void runResultSequence(cropped, PUNCH_MS)
  }

  /**
   * Runs the appear → move + curtain → settle sequence. `appearAt` gives the
   * cutter punch time to finish when there was one; an uploaded photo has no
   * punch to wait for, and no capture spot to fly up from, so its stamp
   * simply appears in place (see the layout effect's null-rect fallback).
   *
   * Sequenced with awaits rather than a pile of timers so the reveal can also
   * wait on the photo being decoded without the later beats drifting.
   */
  async function runResultSequence(stampImage: string, appearAt: number) {
    const run = ++runIdRef.current
    const stillCurrent = () => runIdRef.current === run

    // Both the delay and the decode have to finish: showing an undecoded data
    // URL paints an empty card for a frame or two, which reads as a flicker.
    await Promise.all([sleep(appearAt), decodeImage(stampImage)])
    if (!stillCurrent()) return
    setCroppedImage(stampImage)
    setPhase('appeared')

    await sleep(APPEAR_MS)
    if (!stillCurrent()) return
    setPhase('revealing')

    await sleep(REVEAL_MS)
    if (!stillCurrent()) return
    setPhase('settled')
  }

  /**
   * Nudges focus toward wherever the user tapped. Only some Android devices
   * expose this; elsewhere the camera's continuous autofocus already handles
   * it and this does nothing.
   */
  function handleTapToFocus(event: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current
    if (!video || !live || capturing) return
    const box = video.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width
    const y = (event.clientY - box.top) / box.height
    if (x < 0 || x > 1 || y < 0 || y > 1) return
    void focusAt(mirrored ? 1 - x : x, y)
  }

  function handleRetake() {
    runIdRef.current += 1
    timers.current.forEach(clearTimeout)
    timers.current = []
    setPhase('live')
    setCroppedImage(undefined)
    setPunchKey(0)
    setCarrierStyle({ visibility: 'hidden' })
    setLocation('')
    setDate(todayISO())
    setSaveError(null)
    capturedAtRef.current = null
    videoRef.current?.play().catch(() => {})
  }

  /** Hands the photo to the cropping stage; the cut happens on the shutter. */
  function handleFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setUploadedImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  /**
   * Files the stamp, then hands off to wherever the chosen action leads. Any
   * failure has to surface: a save that quietly does nothing is worse than one
   * that says why.
   */
  async function fileStamp() {
    if (!croppedImage || saving) return null
    setSaving(true)
    try {
      const image = await capImageSize(croppedImage, 1200)
      const saved = addStamp({ image, date, location: location.trim() })
      setSaveError(null)
      return saved
    } catch {
      setSaveError("Couldn't save this stamp — storage on this device is full.")
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveToCollection() {
    if (await fileStamp()) navigate('/collection')
  }

  async function handleSendLetter() {
    // Filed first either way — a stamp you just made shouldn't be able to
    // vanish because the letter flow was abandoned halfway.
    const saved = await fileStamp()
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
          } ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      )}

      {/*
        Header: Back on its own row with the mode toggle centred beneath it, so
        the toggle sits above the cutter instead of down among the controls.
      */}
      <div
        className={`absolute inset-x-0 top-[max(1.25rem,env(safe-area-inset-top))] z-30 flex flex-col items-center gap-4 px-6 transition-opacity duration-300 ${
          capturing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex w-full">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back"
            className="label rounded-full border border-white/40 px-4 py-2 text-white active:scale-95"
          >
            ← BACK
          </button>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {mode === 'capture' ? (
        // Padded clear of the header above and the controls below, so the
        // cutter still centres cleanly at its largest size.
        <div
          className="relative flex h-full w-full flex-col items-center justify-center pt-28 pb-36"
          onClick={handleTapToFocus}
        >
          {/*
            The cutter exists only up through the punch. It hands off to the
            stamp itself, so the two are never on screen together — there is
            only ever one stamp in this sequence.
          */}
          {phase === 'live' && (
            <CaptureFrame windowRef={windowRef} punchKey={punchKey} size={cutterSize} />
          )}

          {!capturing && (status === 'denied' || status === 'unavailable') && (
            <p className="mt-6 max-w-[26ch] text-center text-[15px] leading-[21px] text-white/85">
              {status === 'denied'
                ? "Camera access is off — allow it in your browser's settings, or upload a photo instead."
                : "Couldn't reach a camera on this device — upload a photo instead."}
            </p>
          )}
        </div>
      ) : uploadedImage ? (
        <>
          {/* Same cutter as the camera, dragged over the photo instead. */}
          {phase === 'live' && (
            <UploadCropper
              image={uploadedImage}
              size={cutterSize}
              punchKey={punchKey}
              imgRef={uploadImgRef}
              windowRef={windowRef}
            />
          )}
        </>
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
        </div>
      )}

      {/* Kept mounted in both modes so the picker survives a mode switch. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Controls — fade out once a shot's been taken, so the result reads clearly. */}
      <div
        className={`absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-6 transition-opacity duration-300 ${
          capturing ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        {/* Size and shutter serve both modes; only the side control differs. */}
        {(mode === 'capture' || uploadedImage) && (
          <>
            {/*
              Sits with the controls rather than over the photo: the cutter can
              be dragged right to the photo's edges, so any fixed spot on the
              stage would end up underneath it.
            */}
            {mode === 'upload' && (
              <p className="label pointer-events-none text-white/70">DRAG TO CHOOSE THE AREA</p>
            )}

            <SizeToggle size={cutterSize} onChange={setCutterSize} />

            <div className="flex items-center gap-8">
              {mode === 'capture' ? (
                /* Spacer keeps the shutter centred with a control on one side. */
                <span className="h-11 w-11" aria-hidden />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Choose a different photo"
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                    <path
                      d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m4.8 16 4.3-4.2 3.1 3 2.4-2.2 4.6 4.3"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={handleShutter}
                disabled={mode === 'capture' && !live}
                aria-label={mode === 'upload' ? 'Cut the stamp' : 'Take photo'}
                className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white disabled:opacity-40"
              >
                <span className="h-[58px] w-[58px] rounded-full bg-white active:scale-90 transition-transform" />
              </button>

              {mode === 'capture' ? (
                <button
                  type="button"
                  onClick={flip}
                  disabled={!live}
                  aria-label={mirrored ? 'Switch to rear camera' : 'Switch to front camera'}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/40 bg-black/35 text-white backdrop-blur-sm active:scale-95 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                    <path
                      d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l1-1.6h4.6L14.3 6h3.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.2 12.5a2.8 2.8 0 0 0 4.9 1.6m.7-2.6a2.8 2.8 0 0 0-4.9-1.6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M14.8 9.1V11h-1.9M9.2 15.9V14h1.9"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ) : (
                <span className="h-11 w-11" aria-hidden />
              )}
            </div>
          </>
        )}
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
                className="animate-[stamp-appear_0.4s_linear_both]"
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
              {saveError && (
                <p className="mb-1 text-center text-[14px] leading-[20px] text-post-red-deep">
                  {saveError}
                </p>
              )}
              <button
                type="button"
                onClick={handleSaveToCollection}
                disabled={saving}
                className="label w-full rounded-full bg-post-red-deep py-4 text-white active:scale-[0.98] disabled:opacity-60"
              >
                SAVE TO COLLECTION
              </button>
              <button
                type="button"
                onClick={handleSendLetter}
                disabled={saving}
                className="label w-full rounded-full border-[0.5px] border-ink py-4 text-ink active:scale-[0.98] disabled:opacity-60"
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

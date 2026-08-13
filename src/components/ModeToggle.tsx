export type CaptureMode = 'capture' | 'upload'

const OPTIONS: { mode: CaptureMode; label: string }[] = [
  { mode: 'capture', label: 'CAPTURE' },
  { mode: 'upload', label: 'UPLOAD' },
]

/**
 * Segmented pill switch between live capture and photo upload. Styled for
 * sitting on top of a dark camera feed, so it doesn't borrow the light-mode
 * ink/sun palette used everywhere else in the app.
 */
export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: CaptureMode
  onChange: (mode: CaptureMode) => void
}) {
  return (
    <div className="flex rounded-full border border-white/30 bg-black/35 p-1 backdrop-blur-sm">
      {OPTIONS.map((option) => {
        const active = option.mode === mode
        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => onChange(option.mode)}
            aria-pressed={active}
            className={`label rounded-full px-5 py-2 transition-colors duration-200 ${
              active ? 'bg-sun text-ink' : 'text-white/70'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

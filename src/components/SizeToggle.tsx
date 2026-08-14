import type { CutterSize } from './CaptureFrame'

/** Largest first, so the row reads 1 · 2 · 3 the way stamp grades are named. */
const SIZES: CutterSize[] = [1, 2, 3]

/**
 * Picks the stamp size before shooting. Styled for sitting on a dark camera
 * feed, like ModeToggle — not the light-mode ink/sun palette.
 */
export default function SizeToggle({
  size,
  onChange,
}: {
  size: CutterSize
  onChange: (size: CutterSize) => void
}) {
  return (
    <div
      role="group"
      aria-label="Stamp size"
      className="flex items-center gap-1 rounded-full border border-white/30 bg-black/35 p-1 backdrop-blur-sm"
    >
      {SIZES.map((value) => {
        const active = value === size
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={active}
            aria-label={`Size ${value}`}
            className={`label h-9 w-9 rounded-full transition-colors duration-200 ${
              active ? 'bg-sun text-ink' : 'text-white/70'
            }`}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}

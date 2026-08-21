import fieldLineSvg from '../assets/art/field-line.svg?raw'
import messagePaperSvg from '../assets/art/message-paper.svg?raw'

/**
 * How tall a single-line field stands. Fixed rather than left to the padding:
 * some mobile browsers size a date input to its own internal picker control
 * and ignore vertical padding, which left one hugging its text and shorter
 * than the field beside it. The matching line-height is what actually centres
 * the value — without it those same browsers top-align the internal fields.
 */
const FIELD_H = 50

const LABEL = 'label block text-left text-ink/60'
/**
 * The card the value sits on. Its fill is a plain white here rather than part
 * of the art, so it always covers exactly the field's own rounded corners.
 */
const CARD = 'relative mt-2 bg-[#FCFCFC]'

type FieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * A single-line field on lined paper: one dashed rule, inset near the bottom,
 * since a one-line field needs only the line its text sits on.
 */
export function PaperInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
}: FieldProps & { type?: 'text' | 'date' }) {
  return (
    <div className={className}>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      <div className={`${CARD} rounded-xl`}>
        <div
          className="pointer-events-none absolute inset-x-3 bottom-3 h-[2px] overflow-hidden [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: fieldLineSvg }}
        />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="relative block w-full rounded-xl bg-transparent px-3 text-[16px] text-ink placeholder:text-ink/35"
          style={{ height: FIELD_H, lineHeight: `${FIELD_H}px` }}
        />
      </div>
    </div>
  )
}

/**
 * The multi-line version — a whole page of rules behind a textarea.
 *
 * The lines are inlined rather than pointed at with an <img src>, and told to
 * ignore their own aspect ratio via preserveAspectRatio="none". That's a
 * native SVG stretch, unlike `object-fit: fill` or a background-size
 * percentage on the textarea itself (both tried first), which some browsers
 * apply to the SVG's intrinsic ratio instead of the box asked for —
 * letterboxing the art into a small patch instead of filling the field.
 */
export function PaperTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
}: FieldProps & { rows?: number }) {
  return (
    <div className={className}>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      <div className={`${CARD} rounded-2xl`}>
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl [&>svg]:block"
          dangerouslySetInnerHTML={{ __html: messagePaperSvg }}
        />
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="relative w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-[16px] text-ink placeholder:text-ink/40"
        />
      </div>
    </div>
  )
}

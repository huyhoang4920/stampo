type PillButtonProps = {
  /** Hand-drawn pill shape exported from the design file. */
  art: string
  label: string
  width: number
  height: number
  onClick: () => void
  className?: string
}

/**
 * A speech-bubble style button: the wobbly pill is artwork, the label sits on
 * top of it. The whole pill is the tap target.
 */
export default function PillButton({
  art,
  label,
  width,
  height,
  onClick,
  className,
}: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label.replace(/\n/g, ' ')}
      className={`absolute active:scale-[0.97] transition-transform duration-150 ${className ?? ''}`}
      style={{ width, height }}
    >
      <img data-art src={art} alt="" className="absolute inset-0 h-full w-full" />
      <span className="label absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ink">
        {label}
      </span>
    </button>
  )
}

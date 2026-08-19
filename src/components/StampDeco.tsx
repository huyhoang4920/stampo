import decoRed from '../assets/art/stamp-deco-red.svg'
import decoBlue from '../assets/art/stamp-deco-blue.svg'

type StampDecoProps = {
  /** Red reads on the sun-yellow result screen; blue on the flame collection screens. */
  variant: 'red' | 'blue'
  className?: string
}

/**
 * A small decorative mark tucked into a screen's top-right corner — pure
 * flourish, no meaning attached. Recoloured per screen so it always sits on
 * top of its ground rather than fighting it.
 */
export default function StampDeco({ variant, className }: StampDecoProps) {
  return (
    <img
      data-art
      src={variant === 'blue' ? decoBlue : decoRed}
      alt=""
      className={`pointer-events-none absolute right-6 top-[max(1.5rem,env(safe-area-inset-top))] w-16 ${className ?? ''}`}
    />
  )
}

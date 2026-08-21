import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** Extra delay once this block scrolls into view, for staggering siblings. */
  delay?: number
  className?: string
  style?: CSSProperties
}

/**
 * Fades and rises its children into place the first time they scroll into
 * view, instead of everything on this long page firing at once on mount —
 * most of it is still off-screen at that point anyway. Siblings pass an
 * increasing `delay` to read as one thing appearing after another rather
 * than a single simultaneous block.
 */
export default function Reveal({ children, delay = 0, className = '', style }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      // No bottom margin trim: a block near the very end of a page can sit
      // in the last stretch of scroll room, where trimming the bottom edge
      // would put it permanently out of reach of ever counting as visible.
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className}`}
      style={{
        ...style,
        transitionTimingFunction: 'var(--ease-out-soft)',
        transitionDelay: shown ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  )
}

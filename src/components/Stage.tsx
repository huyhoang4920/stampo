import { useEffect, useState, type ReactNode } from 'react'

/** The home illustration is authored on this canvas. */
export const STAGE_W = 440
export const STAGE_H = 956

/**
 * Centers the 440 x 956 illustration canvas in the viewport and scales it to
 * fit, so the composed artwork keeps its exact proportions on every phone.
 * CSS can't turn viewport units into the unitless factor scale() needs, so the
 * factor is measured here instead.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const scale = useFitScale()

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-sun">
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function useFitScale() {
  const [scale, setScale] = useState(() => measure())

  useEffect(() => {
    const fit = () => setScale(measure())
    fit()
    window.addEventListener('resize', fit)
    window.visualViewport?.addEventListener('resize', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.visualViewport?.removeEventListener('resize', fit)
    }
  }, [])

  return scale
}

function measure() {
  if (typeof window === 'undefined') return 1
  const w = window.visualViewport?.width ?? window.innerWidth
  const h = window.visualViewport?.height ?? window.innerHeight
  return Math.min(w / STAGE_W, h / STAGE_H)
}

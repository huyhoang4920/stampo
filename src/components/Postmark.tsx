import stampFrame from '../assets/art/stamp-frame.svg'

/**
 * The franked-mail mark beside the collection's title: a small stamp with the
 * wordmark on it, cancelled by a pair of wavy lines. The stamp silhouette is
 * the same card art the real stamps use, recoloured by masking rather than a
 * second copy of the artwork.
 */
export default function Postmark({ className }: { className?: string }) {
  return (
    <div className={`relative h-[66px] w-[104px] ${className ?? ''}`} aria-hidden>
      <svg
        viewBox="0 0 90 44"
        fill="none"
        className="absolute left-0 top-[16px] w-[74px] text-sun"
      >
        <path
          d="M2 12c12-9 23 7 35-2s23 7 35-2"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <path
          d="M2 26c12-9 23 7 35-2s23 7 35-2"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
      </svg>

      <div
        className="absolute right-0 top-0 grid h-[66px] w-[46px] place-items-center"
        style={{
          backgroundColor: 'var(--color-sky)',
          maskImage: `url(${stampFrame})`,
          WebkitMaskImage: `url(${stampFrame})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          rotate: '-6deg',
        }}
      >
        <span className="w-[20px] text-center text-[10px] leading-[10px] font-extrabold tracking-[0.04em] break-words text-flame">
          STAMPO
        </span>
      </div>
    </div>
  )
}

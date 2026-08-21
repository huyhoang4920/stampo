import { useNavigate } from 'react-router-dom'
import Reveal from '../components/Reveal'
import instructionTitle from '../assets/art/about-instruction-title.svg'
import stork from '../assets/art/about-stork.png'
import scallopTopSvg from '../assets/art/about-scallop-top.svg?raw'
import scallopBottomSvg from '../assets/art/about-scallop-bottom.svg?raw'
import swash from '../assets/art/about-swash.svg'
import iconTshirt from '../assets/art/about-icon-tshirt.svg'
import iconTote from '../assets/art/about-icon-tote.svg'
import iconArrow from '../assets/art/about-icon-arrow.svg'
import badge510 from '../assets/art/about-badge-5-10.svg'
import badge2030 from '../assets/art/about-badge-20-30.svg'
import badgeDone from '../assets/art/about-badge-done.svg'
import connectorA from '../assets/art/about-connector-a.svg'
import connectorB from '../assets/art/about-connector-b.svg'
import rotationCircle from '../assets/art/about-rotation-circle.svg'
import tshirtPhoto from '../assets/art/about-tshirt.png'

/** Small caption copy throughout this page — one size, always uppercase. */
const CAPTION = 'text-[14px] leading-4 uppercase text-ink'

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-cream">
      <div className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="label w-fit rounded-full border-[0.5px] border-ink px-4 py-2 text-ink"
        >
          ← BACK
        </button>

        {/* Title: the wordmark art, with the stork mascot perched over its tail. */}
        <Reveal className="relative mt-6 w-full" style={{ aspectRatio: '392 / 213' }}>
          <img src={instructionTitle} alt="Instruction" className="absolute inset-x-0 top-0 w-full" />
          <img
            src={stork}
            alt=""
            className="absolute"
            style={{ left: '63.5%', top: '31.7%', width: '35%', height: '71.8%' }}
          />
        </Reveal>

        {/* Step 1 */}
        <Reveal delay={80} className="relative mt-10 flex items-center justify-center gap-6">
          <img
            src={swash}
            alt=""
            className="pointer-events-none absolute left-2 top-1/2 h-[68px] w-[54px] -translate-y-1/2"
          />
          <span className="font-headline text-[64px] leading-[22px] tracking-[-0.03em] text-ink">1</span>
          <h2 className="font-headline text-[32px] leading-10 font-semibold tracking-[-0.03em] text-ink">
            Pick your items
          </h2>
        </Reveal>

        <Reveal delay={160} className="mt-8 flex flex-wrap items-end justify-center gap-x-3 gap-y-5">
          <div className="flex flex-col items-center gap-2">
            <p className={`${CAPTION} text-center`}>Choose your product</p>
            <div className="mt-1 flex items-end justify-center gap-3">
              <div className="flex flex-col items-center gap-2">
                <img src={iconTshirt} alt="" className="h-[27px] w-7" />
                <p className={CAPTION}>T-Shirt</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <img src={iconTote} alt="" className="h-[30px] w-[23px]" />
                <p className={CAPTION}>Tote bag</p>
              </div>
            </div>
          </div>

          <img src={iconArrow} alt="" className="mb-4 h-6 w-6" />
          <p className={`${CAPTION} w-17 whitespace-pre-wrap text-center`}>{'Pick\na color'}</p>

          <img src={iconArrow} alt="" className="mb-4 h-6 w-6" />
          <p className={`${CAPTION} whitespace-pre-wrap text-center`}>{'Pick\nyour size'}</p>
        </Reveal>
      </div>

      {/* Top edge of the "choose your style" band — a scalloped tear, not a straight line. */}
      <div
        className="h-14 w-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: scallopTopSvg }}
      />

      {/* Step 2 */}
      <div className="bg-gold px-6 pb-8">
        <Reveal className="relative flex items-center justify-center gap-6 py-2">
          <img
            src={swash}
            alt=""
            className="pointer-events-none absolute left-4 top-[calc(50%+8px)] h-[68px] w-[54px] -translate-y-1/2"
          />
          <span className="font-headline text-[64px] leading-[22px] tracking-[-0.03em] text-ink">2</span>
          <h2 className="font-headline text-[32px] leading-10 font-semibold tracking-[-0.03em] text-ink">
            Choose your style
          </h2>
        </Reveal>

        <Reveal delay={100} className="relative mt-8">
          <div className="flex items-center">
            <svg viewBox="0 0 22 22" className="h-[22px] w-[22px] shrink-0" aria-hidden>
              <circle cx="11" cy="11" r="11" fill="#EFE9DE" />
            </svg>
            <p className={`${CAPTION} -ml-3.5`}>Option A</p>
          </div>
          <div className="mt-2 w-fit rounded-full border border-ink bg-cornflower px-4 py-2">
            <p className="font-headline text-2xl leading-[30px] font-semibold tracking-[-0.03em] text-ink">
              ready-made patch
            </p>
          </div>
          <p className={`${CAPTION} mt-2 whitespace-pre-line`}>
            {'Pick from our patch collection\nIcons, symbols or letter stamps'}
          </p>

          <img
            src={badge2030}
            alt="Takes 20 to 30 minutes"
            className="pointer-events-none absolute -top-4 right-4 h-18 w-18"
          />
        </Reveal>

        <Reveal delay={220} className="relative mt-8 pl-32">
          <img src={connectorA} alt="" className="pointer-events-none absolute top-0 left-[60px] h-[89px] w-9" />
          <img
            src={connectorB}
            alt=""
            className="pointer-events-none absolute top-[76px] left-[60px] h-[158px] w-[62px]"
          />

          <div className="flex items-center">
            <svg viewBox="0 0 22 22" className="h-[22px] w-[22px] shrink-0" aria-hidden>
              <circle cx="11" cy="11" r="11" fill="#EFE9DE" />
            </svg>
            <p className={`${CAPTION} -ml-3.5`}>Option B</p>
          </div>
          <div className="mt-2 w-fit rounded-full border border-ink bg-cornflower px-4 py-2">
            <p className="font-headline text-2xl leading-[30px] font-semibold tracking-[-0.03em] text-ink">
              custom print
            </p>
          </div>
          <p className={`${CAPTION} mt-2 whitespace-pre-line`}>
            {'Choose a design template\nAdd your name\nPrinted fresh for you'}
          </p>

          <img
            src={badge510}
            alt="Takes 5 to 10 minutes"
            className="pointer-events-none absolute top-1 right-0 h-18 w-18"
          />
        </Reveal>
      </div>

      {/* Bottom edge of the band, tearing back into the cream ground. */}
      <div
        className="h-17 w-full [&>svg]:block"
        dangerouslySetInnerHTML={{ __html: scallopBottomSvg }}
      />

      {/* Step 3 */}
      <div className="px-6 pb-16">
        <Reveal className="relative flex items-center justify-center gap-6">
          <img
            src={swash}
            alt=""
            className="pointer-events-none absolute left-2 top-1/2 h-[68px] w-[54px] -translate-y-1/2"
          />
          <span className="font-headline text-[64px] leading-[22px] tracking-[-0.03em] text-ink">3</span>
          <h2 className="font-headline text-[32px] leading-10 font-semibold tracking-[-0.03em] text-ink whitespace-pre-line">
            {'Watch it\ncome to life!'}
          </h2>
        </Reveal>

        <Reveal delay={100} className="mt-8 flex items-start justify-center gap-8">
          <p className={`${CAPTION} w-[190px] whitespace-pre-line`}>
            {'We press your design\nright in front of you\n\nYour one-of-a-kind piece'}
          </p>
          <img src={badgeDone} alt="Done!" className="mt-1 h-17 w-17 shrink-0" />
        </Reveal>

        <Reveal delay={220} className="relative mx-auto mt-8 h-[322px] w-[322px]">
          <img
            src={rotationCircle}
            alt=""
            className="absolute inset-0 h-full w-full animate-[spin_18s_linear_infinite]"
          />
          <img
            src={tshirtPhoto}
            alt="A t-shirt printed with your stamp design"
            className="absolute top-1/2 left-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2"
          />
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-10 max-w-[334px] text-center">
          <p className="font-headline text-[32px] leading-10 font-semibold tracking-[-0.03em] text-post-red-deep">
            Purchase it at Stampo!
          </p>
        </Reveal>
      </div>
    </div>
  )
}

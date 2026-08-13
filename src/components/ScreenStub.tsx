import { useNavigate } from 'react-router-dom'

/**
 * Temporary shell for screens that are routed but not designed yet, so the
 * home screen's navigation is real and testable end to end.
 */
export default function ScreenStub({ title, note }: { title: string; note: string }) {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-sun px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="label w-fit rounded-full border-[0.5px] border-ink px-4 py-2"
      >
        ← BACK
      </button>

      <div className="mt-16">
        <h1 className="max-w-[8ch] text-[44px] leading-[0.95] font-extrabold tracking-[-0.03em] uppercase">
          {title}
        </h1>
        <p className="mt-5 max-w-[30ch] text-[15px] leading-[22px] text-ink/70">{note}</p>
      </div>
    </div>
  )
}

import { ArrowRight, MessageSquareCode } from "lucide-react";
import { BrandButton } from "./brand-button";

const avatarColors = ["bg-purple text-white", "bg-cyan text-ink", "bg-amber text-ink"];

export function Hero({ waitlistCount }: { waitlistCount: number }) {
  const displayCount = waitlistCount > 0 ? waitlistCount : 128;

  return (
    <section
      id="top"
      className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-5 pb-10 pt-14 sm:px-7 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-[72px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-10 hidden size-[280px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(108,59,255,0.22),rgba(108,59,255,0)_70%)] lg:block"
      />

      <div className="relative z-[2]">
        <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-lime px-3.5 py-2 font-mono-label text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_var(--color-ink)]">
          <span className="brand-blink size-2 rounded-full bg-ink" />
          Made for Gen Z, by Gen Z
        </span>

        <h1 className="mt-5 text-balance font-display text-[44px] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-[58px] sm:leading-[0.96] lg:text-[72px] lg:leading-[0.94]">
          Land the job.
          <br />
          Not the{" "}
          <span className="rounded [box-decoration-break:clone] [-webkit-box-decoration-break:clone] bg-[linear-gradient(var(--color-amber),var(--color-amber))] bg-[length:100%_12px] bg-[position:0_86%] bg-no-repeat text-purple">
            existential dread.
          </span>
        </h1>

        <p className="mt-6 max-w-[520px] text-pretty text-lg leading-relaxed text-text-secondary sm:text-[19px]">
          Practice interviews with honest feedback. A résumé score you can trace
          line by line. A salary range with its working shown. One career plan,
          one tracker, one place for the whole job hunt.
        </p>

        <div className="mt-8 flex flex-wrap gap-3.5">
          <BrandButton href="/signup" size="lg" fill="purple" shadow="ink">
            Start free — no card
            <ArrowRight className="size-4.5" />
          </BrandButton>
          <BrandButton href="#showcase" size="lg" fill="cream" shadow="cyan">
            Watch a mock interview
          </BrandButton>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex">
            {avatarColors.map((c, i) => (
              <span
                key={i}
                style={{ marginLeft: i === 0 ? 0 : -12 }}
                className={`flex size-11 items-center justify-center rounded-full border-2 border-ink font-display text-sm font-extrabold ${c}`}
              >
                <MessageSquareCode className="size-4.5" />
              </span>
            ))}
            <span
              style={{ marginLeft: -12 }}
              className="flex size-11 items-center justify-center rounded-full border-2 border-ink bg-pink text-xs font-extrabold text-white"
            >
              +{displayCount > 999 ? `${Math.floor(displayCount / 1000)}k` : displayCount}
            </span>
          </div>
          <div className="text-sm leading-tight text-text-secondary">
            <strong className="text-ink">
              {displayCount.toLocaleString("en-IN")}+ students
            </strong>{" "}
            on the waitlist
            <br />
            <span className="font-mono-label text-xs">
              ★★★★★ built with real interview rubrics
            </span>
          </div>
        </div>
      </div>

      <HeroVisual />
    </section>
  );
}

/** Illustrated device-mockup replacing the photo placeholder — a stylized
 * mock-interview screen, matching the sticker/neobrutalist system. */
function HeroVisual() {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[440px] sm:h-[500px] lg:h-[560px]">
      <div className="absolute inset-[24px_0_0_8px] rotate-[-3deg] rounded-[28px] border-2 border-ink bg-cyan" />
      <div className="absolute inset-[0_8px_24px_0] overflow-hidden rounded-[28px] border-2 border-ink bg-white shadow-[8px_8px_0_var(--color-ink)]">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-cream px-4 py-3.5">
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="brand-blink size-2.5 rounded-full bg-pink" />
            Round 1 · Frontend Engineer
          </span>
          <span className="font-mono-label text-xs text-text-secondary">
            08:42 left
          </span>
        </div>
        <div className="flex flex-col gap-3 p-5">
          <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-4 py-3 text-sm leading-relaxed shadow-[3px_3px_0_var(--color-ink)]">
            Tell me about a time you shipped something under a tight deadline.
          </div>
          <div className="max-w-[85%] self-end rounded-2xl rounded-tr-sm border-2 border-ink bg-ink px-4 py-3 text-sm leading-relaxed text-cream">
            We had two weeks for a feature with a vague spec, so I scoped an
            MVP, shipped it behind a flag, and iterated on feedback…
          </div>
          <div className="max-w-[85%] self-start rounded-2xl rounded-tl-sm border-2 border-ink bg-lime px-4 py-3 text-sm leading-relaxed">
            <strong>Good structure.</strong> Now quantify the impact.
          </div>
        </div>
      </div>

      <div
        style={{ ["--r" as string]: "-5deg" }}
        className="brand-float absolute left-[-14px] top-9 w-[168px] rounded-2xl border-2 border-ink bg-white p-3.5 shadow-[4px_4px_0_var(--color-ink)] sm:left-[-30px]"
      >
        <div className="font-mono-label text-[11px] font-bold uppercase tracking-wider text-purple">
          Offer accepted
        </div>
        <div className="mt-0.5 font-display text-xl font-extrabold">
          +22% negotiated
        </div>
        <div className="text-xs text-text-secondary">with a negotiation script</div>
      </div>

      <div
        style={{ ["--r" as string]: "4deg", animationDelay: "0.8s" }}
        className="brand-float absolute bottom-[70px] right-[-14px] rounded-2xl border-2 border-ink bg-lime p-3.5 shadow-[4px_4px_0_var(--color-ink)] sm:right-[-26px]"
      >
        <div className="font-mono-label text-[11px] font-bold uppercase tracking-wider">
          Interview score
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-extrabold">86</span>
          <span className="text-xs font-bold">/100 · up 31 pts</span>
        </div>
      </div>

      <div className="absolute -top-3.5 right-3 flex size-[72px] items-center justify-center rounded-full border-2 border-ink bg-amber text-center font-mono-label text-[10px] font-bold leading-tight shadow-[3px_3px_0_var(--color-ink)]">
        NO
        <br />
        GATE-
        <br />
        KEEPING
      </div>
    </div>
  );
}

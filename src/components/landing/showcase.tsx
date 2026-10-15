import { Check } from "lucide-react";

const points = [
  "Chat, MCQ and live coding rounds",
  "Scored on structure, depth and clarity",
  "Transcript + fix-list saved to your dashboard",
];

export function Showcase() {
  return (
    <section id="showcase" className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="grid gap-10 rounded-[32px] border-2 border-ink bg-purple p-7 shadow-[10px_10px_0_var(--color-ink)] sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12 lg:p-12">
        <div>
          <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-lime">
            02 — Live demo
          </span>
          <h2 className="mt-3 text-balance font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-[38px] lg:text-[46px] lg:leading-[1.02]">
            An interviewer that doesn&apos;t ghost you.
          </h2>
          <p className="mt-4.5 text-[17px] leading-relaxed text-[#E3DBFF]">
            Pick a role, pick a round, and go. It follows up on your answers
            like a real interviewer, then breaks down exactly what to fix —
            no vague &ldquo;be more confident&rdquo;.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {points.map((p) => (
              <span key={p} className="flex items-center gap-2.5 text-[15px] font-semibold text-white">
                <Check className="size-4.5 shrink-0 text-lime" strokeWidth={3} />
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border-2 border-ink bg-cream shadow-[8px_8px_0_var(--color-ink)]">
          <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-white px-4.5 py-3.5">
            <span className="flex items-center gap-2.5 text-sm font-bold">
              <span className="brand-blink size-2.5 rounded-full bg-pink" />
              Round 2 · Product Analyst
            </span>
            <span className="font-mono-label text-xs text-text-secondary">
              12:04 left
            </span>
          </div>
          <div className="flex flex-col gap-3.5 p-5">
            <div className="max-w-[82%] self-start rounded-2xl rounded-tl-sm border-2 border-ink bg-white px-4 py-3.5 text-sm leading-relaxed">
              Walk me through a time your analysis changed a decision. What
              was the decision before you got involved?
            </div>
            <div className="max-w-[82%] self-end rounded-2xl rounded-tr-sm border-2 border-ink bg-ink px-4 py-3.5 text-sm leading-relaxed text-cream">
              During my internship the team was about to cut the referral
              flow. I pulled the funnel data and found 38% of signups touched
              it…
            </div>
            <div className="max-w-[82%] self-start rounded-2xl rounded-tl-sm border-2 border-ink bg-lime px-4 py-3.5 text-sm leading-relaxed">
              <strong>Good structure.</strong> Now quantify the outcome —
              what happened after they kept it?
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-dashed border-ink bg-white px-4 py-3">
              <span className="text-sm text-text-muted-2">
                Type your answer…
              </span>
              <span className="ml-auto flex size-8 items-center justify-center rounded-lg border-2 border-ink bg-purple text-white">
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

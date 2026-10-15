const tags = [
  { label: "LGBTQIA+ students", bg: "bg-pink-tint" },
  { label: "First-gen graduates", bg: "bg-[#EFE8FF]" },
  { label: "Neurodivergent folks", bg: "bg-[#E6FAFF]" },
  { label: "Disabled jobseekers", bg: "bg-[#F2FFD6]" },
  { label: "Career switchers", bg: "bg-[#FFF2DC]" },
  { label: "International students", bg: "bg-pink-tint" },
  { label: "Tier-2 & tier-3 colleges", bg: "bg-[#EFE8FF]" },
  { label: "Returning after a break", bg: "bg-[#E6FAFF]" },
];

const promises = [
  {
    title: "Pronouns, respected",
    body: "Set them once — every letter, resume and mock interview uses them.",
  },
  {
    title: "Bias-aware feedback",
    body: "Coaching on your answers, never on your accent, name or background.",
  },
  {
    title: "Screen-reader friendly",
    body: "Keyboard-first flows, captions on every mock round, adjustable pace.",
  },
  {
    title: "Free where it matters",
    body: "Scholarship seats for students who can't pay. No forms, no proving it.",
  },
];

export function InclusiveSection() {
  return (
    <section id="inclusive" className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="overflow-hidden rounded-[32px] border-2 border-ink bg-white shadow-[10px_10px_0_var(--color-ink)]">
        <div className="h-3.5 bg-[linear-gradient(90deg,var(--color-pink)_0_14%,var(--color-amber)_14%_28%,var(--color-lime)_28%_42%,var(--color-cyan)_42%_56%,var(--color-purple)_56%_70%,var(--color-ink)_70%_85%,#8B5E3C_85%_100%)]" />
        <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:p-12">
          <div>
            <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-pink">
              04 — Who it&apos;s for
            </span>
            <h2 className="mt-3 text-balance font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[38px] lg:text-[48px] lg:leading-[1.02]">
              Every kind of person. Every kind of path.
            </h2>
            <p className="mt-4.5 max-w-[520px] text-[17px] leading-relaxed text-text-secondary">
              Hiring was never built for all of us. Sparr is.
              We&apos;re proudly inclusive — LGBTQIA+ friendly, and built with
              the people who usually get left out of &ldquo;career
              advice&rdquo; — because the job market is hard enough without
              having to translate yourself first.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {tags.map((t) => (
                <span
                  key={t.label}
                  className={`rounded-full border-2 border-ink px-4 py-2 text-sm font-bold ${t.bg}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {promises.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border-2 border-ink bg-cream p-4"
                >
                  <strong className="block text-[15px]">{p.title}</strong>
                  <span className="text-sm leading-relaxed text-text-secondary">
                    {p.body}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <InclusiveVisual />
        </div>
      </div>
    </section>
  );
}

/** Abstract graphic composition replacing the two photo placeholders —
 * pattern/shape art rather than depicting real people. */
function InclusiveVisual() {
  return (
    <div className="relative min-h-[380px] lg:min-h-[520px]">
      <div className="absolute inset-x-0 top-0 bottom-[120px] overflow-hidden rounded-[22px] border-2 border-ink shadow-[5px_5px_0_var(--color-pink)]">
        <div className="grid size-full grid-cols-4 grid-rows-3">
          {Array.from({ length: 12 }).map((_, i) => {
            const colors = ["bg-purple", "bg-pink", "bg-cyan", "bg-amber", "bg-lime", "bg-ink"];
            return <div key={i} className={colors[i % colors.length]} />;
          })}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-[110px] w-[56%] overflow-hidden rounded-2xl border-2 border-ink shadow-[5px_5px_0_var(--color-cyan)]"
        style={{
          background:
            "linear-gradient(90deg, var(--color-pink) 0 16%, var(--color-amber) 16% 32%, var(--color-lime) 32% 48%, var(--color-cyan) 48% 64%, var(--color-purple) 64% 80%, var(--color-ink) 80% 100%)",
        }}
      />
      <div className="absolute bottom-0 right-0 flex h-[110px] w-[40%] flex-col justify-center rounded-2xl border-2 border-ink bg-lime p-3.5 shadow-[5px_5px_0_var(--color-ink)]">
        <span className="font-display text-3xl font-extrabold leading-none">
          Yours
        </span>
        <span className="mt-1 text-[13px] font-semibold leading-tight">
          Export or delete your data any time
        </span>
      </div>
    </div>
  );
}

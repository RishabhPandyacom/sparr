const testimonials = [
  {
    quote:
      "I'd failed four interviews and had no idea why. Two weeks of mock rounds later I could actually hear the difference in my answers. Offer in hand.",
    initials: "AM",
    avatarBg: "bg-purple text-white",
    name: "Aarav M.",
    pronoun: "he/him",
    role: "Data Analyst · Bengaluru",
    shadow: "shadow-[6px_6px_0_var(--color-amber)]",
  },
  {
    quote:
      "First place that asked my pronouns before asking my CGPA. The cover letters sounded like me, not like a template from 2009.",
    initials: "RK",
    avatarBg: "bg-cyan text-ink",
    name: "Ria K.",
    pronoun: "they/them",
    role: "UX Designer · Remote",
    shadow: "shadow-[6px_6px_0_var(--color-cyan)]",
  },
  {
    quote:
      "The salary script felt scary to say out loud. I said it anyway and got a better offer. Paid for the subscription many times over.",
    initials: "SD",
    avatarBg: "bg-amber text-ink",
    name: "Sanya D.",
    pronoun: "she/her",
    role: "Backend Engineer · Pune",
    shadow: "shadow-[6px_6px_0_var(--color-lime)]",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <h2 className="max-w-[600px] text-balance font-display text-[34px] font-extrabold leading-none tracking-[-0.03em] sm:text-[44px] lg:text-[52px]">
          They practised here. Then they got the call.
        </h2>
        <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">
          05 — Sample stories
        </span>
      </div>
      <div className="mt-11 grid gap-5 lg:grid-cols-3">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className={`rounded-[22px] border-2 border-ink bg-white p-6.5 ${t.shadow}`}
          >
            <div className="font-mono-label text-xs font-bold tracking-[0.08em] text-pink">
              ★★★★★
            </div>
            <p className="mt-3 text-[15.5px] leading-relaxed">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3 border-t-2 border-dashed border-border-muted pt-4.5">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-sm font-extrabold ${t.avatarBg}`}
              >
                {t.initials}
              </span>
              <div className="text-sm leading-tight">
                <strong>{t.name}</strong> ({t.pronoun})
                <br />
                <span className="text-text-secondary">{t.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-center font-mono-label text-[11px] text-text-muted-2">
        Illustrative example stories — not verified customer reviews.
      </p>
    </section>
  );
}

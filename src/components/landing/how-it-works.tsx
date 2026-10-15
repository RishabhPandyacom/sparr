const steps = [
  {
    n: "01",
    bg: "bg-amber",
    text: "text-ink",
    title: "Tell us your goal",
    body: "Role, city, dream companies, and how much time you actually have. Takes 90 seconds.",
  },
  {
    n: "02",
    bg: "bg-pink",
    text: "text-white",
    title: "Build & practise",
    body: "Resume, cover letter, mock rounds. Everything lives in one dashboard, versioned and ready.",
  },
  {
    n: "03",
    bg: "bg-cyan",
    text: "text-ink",
    title: "Apply and negotiate",
    body: "Track every application, get nudged before deadlines, and talk numbers without flinching.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">
        03 — How it works
      </span>
      <h2 className="mt-3 mb-10 font-display text-[34px] font-extrabold leading-none tracking-[-0.03em] sm:text-[44px] lg:text-[52px]">
        Three steps. Zero LinkedIn cringe.
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className={`rounded-[22px] border-2 border-ink p-7 shadow-[6px_6px_0_var(--color-ink)] ${s.bg} ${s.text}`}
          >
            <span className="block font-display text-[48px] font-extrabold leading-none sm:text-[56px]">
              {s.n}
            </span>
            <h3 className="mt-3.5 font-display text-2xl font-bold tracking-[-0.02em]">
              {s.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

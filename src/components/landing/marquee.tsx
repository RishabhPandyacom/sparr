const items = [
  { label: "MOCK INTERVIEWS", dot: "text-lime" },
  { label: "ATS-PROOF RESUMES", dot: "text-pink" },
  { label: "COVER LETTERS IN 30s", dot: "text-cyan" },
  { label: "SALARY NEGOTIATION", dot: "text-amber" },
  { label: "AUTO-APPLY JOB BOARD", dot: "text-lime" },
  { label: "DEADLINE REMINDERS", dot: "text-pink" },
];

function Track() {
  return (
    <div className="flex shrink-0 items-center gap-11 pr-11 font-display text-base font-bold text-cream sm:text-lg">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-11 whitespace-nowrap">
          {it.label}
          <span className={it.dot}>✳</span>
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="mt-6 overflow-hidden border-y-2 border-ink bg-ink py-3.5">
      <div className="brand-marquee flex w-max">
        <Track />
        <Track />
      </div>
    </div>
  );
}

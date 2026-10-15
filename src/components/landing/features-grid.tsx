import {
  MessageSquareCode,
  FileText,
  Mail,
  Calculator,
  Briefcase,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: MessageSquareCode,
    iconBg: "bg-purple",
    iconFg: "text-cream",
    hoverShadow: "hover:shadow-[9px_9px_0_var(--color-purple)]",
    title: "Human-like AI mock interviews",
    body: "Practice chat, MCQ, and live coding rounds. Get instant, honest feedback and a score.",
  },
  {
    icon: FileText,
    iconBg: "bg-pink",
    iconFg: "text-cream",
    hoverShadow: "hover:shadow-[9px_9px_0_var(--color-pink)]",
    title: "AI resume builder",
    body: "Five editable templates. Fill them in live and download a clean PDF in seconds.",
  },
  {
    icon: Mail,
    iconBg: "bg-cyan",
    iconFg: "text-ink",
    hoverShadow: "hover:shadow-[9px_9px_0_var(--color-cyan)]",
    title: "AI cover letters",
    body: "Paste a job description and get a tailored cover letter that sounds like you.",
  },
  {
    icon: Calculator,
    iconBg: "bg-amber",
    iconFg: "text-ink",
    hoverShadow: "hover:shadow-[9px_9px_0_var(--color-amber)]",
    title: "Salary negotiator",
    body: "Know your range and walk into the conversation with a script that works.",
  },
  {
    icon: Briefcase,
    iconBg: "bg-lime",
    iconFg: "text-ink",
    hoverShadow: "hover:shadow-[9px_9px_0_var(--color-lime)]",
    title: "Auto-apply job board",
    body: "Coming soon. Join the waitlist and be first in line when it launches.",
    badge: "Soon",
  },
  {
    icon: Bell,
    iconBg: "bg-cream",
    iconFg: "text-ink",
    hoverShadow: "hover:shadow-[9px_9px_0_var(--color-purple)]",
    title: "Reminders & updates",
    body: "Never miss an interview, deadline, or follow-up. We keep you on track.",
    dark: true,
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div>
          <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">
            01 — The toolkit
          </span>
          <h2 className="mt-3 max-w-[620px] text-balance font-display text-[34px] font-extrabold leading-[1.02] tracking-[-0.03em] sm:text-[44px] lg:text-[52px] lg:leading-none">
            One subscription. The whole job hunt.
          </h2>
        </div>
        <p className="max-w-[340px] text-base leading-relaxed text-text-secondary">
          Six tools that replace the fourteen tabs, three subscriptions and
          one very tired senior you keep bothering.
        </p>
      </div>

      <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className={`relative rounded-[22px] border-2 border-ink p-7 shadow-[6px_6px_0_var(--color-ink)] transition-all duration-150 ease-out hover:-translate-x-1 hover:-translate-y-1 ${f.hoverShadow} ${
              f.dark ? "bg-ink text-cream" : "bg-white"
            }`}
          >
            {f.badge && (
              <span className="absolute right-5 top-5 rounded-full border-2 border-ink bg-lime px-2.5 py-1 font-mono-label text-[10px] font-bold uppercase tracking-wider text-ink">
                {f.badge}
              </span>
            )}
            <span
              className={`flex size-12 items-center justify-center rounded-2xl border-2 border-ink ${f.iconBg}`}
            >
              <f.icon className={`size-5.5 ${f.iconFg}`} strokeWidth={2} />
            </span>
            <h3 className="mt-4.5 font-display text-[22px] font-bold tracking-[-0.02em]">
              {f.title}
            </h3>
            <p
              className={`mt-2.5 text-[15px] leading-relaxed ${f.dark ? "text-[#BDB6CC]" : "text-text-secondary"}`}
            >
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

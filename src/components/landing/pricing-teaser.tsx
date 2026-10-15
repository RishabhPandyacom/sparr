import { Check } from "lucide-react";
import { BrandButton } from "./brand-button";

const tiers = [
  {
    name: "Starter",
    price: "Free",
    blurb: "For getting your first draft out of your head.",
    features: ["2 mock interviews / month", "1 resume + PDF export", "3 cover letters"],
    cta: "Start free",
    variant: "light" as const,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    blurb: "For the season when you're applying everywhere.",
    features: [
      "Unlimited mock interviews",
      "All 5 resume templates",
      "Salary negotiator + scripts",
      "Early access to the job board",
    ],
    cta: "Go Pro",
    variant: "dark" as const,
    badge: "Most picked",
  },
  {
    name: "Campus",
    price: "Let's talk",
    blurb: "For placement cells and student communities.",
    features: [
      "Seats for your whole batch",
      "Placement dashboard & reports",
      "Scholarship seats included",
    ],
    cta: "Book a call",
    variant: "light" as const,
  },
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="mx-auto max-w-[1240px] px-5 pt-20 sm:px-7 sm:pt-24">
      <div className="text-center">
        <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">
          06 — Pricing
        </span>
        <h2 className="mt-3 font-display text-[34px] font-extrabold leading-none tracking-[-0.03em] sm:text-[44px] lg:text-[52px]">
          Simple pricing, priced by interviews
        </h2>
        <p className="mt-3.5 text-lg text-text-secondary">
          Start free. Upgrade when you&apos;re ready to go all in.
        </p>
      </div>

      <div className="mt-11 grid items-start gap-5 lg:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={`relative rounded-3xl border-2 border-ink p-7 ${
              t.variant === "dark"
                ? "-translate-y-3.5 bg-ink text-cream shadow-[8px_8px_0_var(--color-pink)]"
                : "bg-white shadow-[6px_6px_0_var(--color-ink)]"
            }`}
          >
            {t.badge && (
              <span className="absolute -top-4 left-7 rounded-full border-2 border-ink bg-lime px-3.5 py-1.5 font-mono-label text-[11px] font-bold uppercase tracking-wider text-ink">
                {t.badge}
              </span>
            )}
            <h3 className="font-display text-[22px] font-bold">{t.name}</h3>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-display text-[40px] font-extrabold tracking-[-0.03em] sm:text-[46px]">
                {t.price}
              </span>
              {t.period && (
                <span className="text-[15px] text-[#BDB6CC]">{t.period}</span>
              )}
            </div>
            <p
              className={`mt-1.5 text-sm ${t.variant === "dark" ? "text-[#BDB6CC]" : "text-text-secondary"}`}
            >
              {t.blurb}
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-[15px]">
              {t.features.map((f) => (
                <span key={f} className="flex gap-2.5">
                  <Check
                    className={`mt-0.5 size-4.5 shrink-0 ${t.variant === "dark" ? "text-lime" : "text-purple"}`}
                    strokeWidth={3}
                  />
                  {f}
                </span>
              ))}
            </div>
            <BrandButton
              href="/pricing"
              fill={t.variant === "dark" ? "purple" : "cream"}
              shadow="ink"
              className="mt-6.5 w-full"
            >
              {t.cta}
            </BrandButton>
          </div>
        ))}
      </div>
    </section>
  );
}

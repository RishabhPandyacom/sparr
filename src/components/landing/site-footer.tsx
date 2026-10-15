import Link from "next/link";
import { Sparkles } from "lucide-react";

const columns = [
  {
    heading: "Product",
    links: [
      { href: "#features", label: "Mock interviews" },
      { href: "#features", label: "Resume builder" },
      { href: "#features", label: "Cover letters" },
      { href: "#waitlist", label: "Job board waitlist" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "#inclusive", label: "Who it's for" },
      { href: "#inclusive", label: "Inclusion promise" },
      { href: "#faq", label: "FAQ" },
      { href: "#waitlist", label: "Contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "#faq", label: "Privacy" },
      { href: "#faq", label: "Terms" },
      { href: "#faq", label: "Accessibility" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink bg-ink text-cream">
      <div className="mx-auto grid max-w-[1240px] gap-9 px-5 py-14 sm:px-7 sm:py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <span className="flex items-center gap-2.5 font-display text-xl font-extrabold">
            <span className="flex size-9 items-center justify-center rounded-xl border-2 border-cream bg-purple">
              <Sparkles className="size-4.5 text-cream" />
            </span>
            Sparr
          </span>
          <p className="mt-4 max-w-[280px] text-[14.5px] leading-relaxed text-[#BDB6CC]">
            Made for Gen Z, by Gen Z. Inclusive by default, first-gen
            friendly, and allergic to gatekeeping.
          </p>
          <div
            className="mt-4.5 h-2 max-w-[220px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-pink) 0 16%, var(--color-amber) 16% 32%, var(--color-lime) 32% 48%, var(--color-cyan) 48% 64%, var(--color-purple) 64% 80%, var(--color-cream) 80% 100%)",
            }}
          />
        </div>

        {columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-2.5 text-[14.5px]">
            <span className="font-mono-label text-[11px] uppercase tracking-[0.14em] text-text-muted-2">
              {col.heading}
            </span>
            {col.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-cream transition-colors hover:text-lime"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-5 border-t border-[#3A3550] px-5 py-6 text-[13.5px] text-text-muted-2 sm:px-7">
        <span>© {new Date().getFullYear()} Sparr. All rights reserved.</span>
        <span className="font-mono-label">Built by Sparr</span>
      </div>
    </footer>
  );
}

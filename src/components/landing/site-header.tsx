import Link from "next/link";
import { Sparkles } from "lucide-react";
import { getOptionalUser } from "@/lib/auth/guards";
import { BrandButton } from "./brand-button";
import { MobileNav } from "./mobile-nav";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#inclusive", label: "Who it's for" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export async function SiteHeader() {
  const user = await getOptionalUser();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-ink bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between gap-6 px-5 sm:px-7">
        <Link
          href="#top"
          className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-ink"
        >
          <span className="flex size-9.5 items-center justify-center rounded-xl border-2 border-ink bg-purple shadow-[3px_3px_0_var(--color-ink)]">
            <Sparkles className="size-4.5 text-cream" strokeWidth={2} />
          </span>
          Sparr
        </Link>

        <nav className="hidden items-center gap-1 text-[15px] font-semibold md:flex">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3.5 py-2 text-ink transition-colors hover:bg-ink/5"
            >
              {l.label}
            </a>
          ))}
          <Link
            href={user ? "/dashboard" : "/login"}
            className="ml-1 rounded-lg px-3.5 py-2 text-ink transition-colors hover:bg-ink/5"
          >
            {user ? "Dashboard" : "Log in"}
          </Link>
          <Link
            href={user ? "/dashboard" : "/signup"}
            className="ml-1.5 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-4.5 py-2.5 text-[15px] font-bold text-cream shadow-[3px_3px_0_var(--color-lime)] transition-colors hover:bg-purple hover:shadow-[3px_3px_0_var(--color-pink)]"
          >
            {user ? "Go to dashboard" : "Start free"}
          </Link>
        </nav>

        <MobileNav links={navLinks} loggedIn={!!user} />
      </div>
    </header>
  );
}

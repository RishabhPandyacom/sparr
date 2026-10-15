"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav({
  links,
  loggedIn,
}: {
  links: { href: string; label: string }[];
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-cream text-ink shadow-[3px_3px_0_var(--color-ink)]"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-[74px] z-40 border-b-2 border-ink bg-cream px-5 pb-6 pt-2 shadow-[0_8px_0_-4px_var(--color-ink)]">
          <nav className="flex flex-col gap-1 text-base font-semibold">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-ink hover:bg-ink/5"
              >
                {l.label}
              </a>
            ))}
            <Link
              href={loggedIn ? "/dashboard" : "/login"}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-ink hover:bg-ink/5"
            >
              {loggedIn ? "Dashboard" : "Log in"}
            </Link>
            <Link
              href={loggedIn ? "/dashboard" : "/signup"}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl border-2 border-ink bg-ink px-4 py-3 text-center text-cream shadow-[3px_3px_0_var(--color-lime)]"
            >
              {loggedIn ? "Go to dashboard" : "Start free"}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

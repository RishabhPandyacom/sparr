"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

/** Slide-down navigation for screens narrower than `md`. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-xl border-2 border-ink bg-white shadow-[2px_2px_0_var(--brand-ink)]"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-16 z-30 max-h-[calc(100svh-4rem)] overflow-y-auto border-b-2 border-ink bg-ink py-4">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="mb-3 flex items-center gap-2 px-6 font-display text-lg font-extrabold text-cream"
          >
            <Sparkles className="size-4 text-lime" /> Sparr
          </Link>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

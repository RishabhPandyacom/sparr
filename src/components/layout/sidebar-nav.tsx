"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-lime text-ink"
                : "text-cream/70 hover:bg-white/10 hover:text-cream",
            )}
          >
            <item.icon className="size-4 shrink-0" strokeWidth={2.25} />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 font-mono-label text-[9px] font-bold uppercase tracking-wider",
                  active ? "border-ink/40" : "border-cream/30",
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

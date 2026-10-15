"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { key: "resume", label: "Résumé", n: 1 },
  { key: "salary", label: "Salary", n: 2 },
  { key: "summary", label: "Career summary", n: 3 },
] as const;

export type StepKey = (typeof steps)[number]["key"];

/**
 * Three-step progress bar. `reached` is the furthest step the saved plan
 * allows (so a user can go back, but not skip ahead past unsaved work).
 */
export function StepProgress({
  planId,
  reached,
  complete,
}: {
  planId: string;
  reached: 1 | 2 | 3;
  complete: boolean;
}) {
  const pathname = usePathname();
  const active = (steps.find((s) => pathname.endsWith(`/${s.key}`))?.key ?? "resume") as StepKey;
  return (
    <ol className="mb-8 grid grid-cols-3 gap-2 sm:gap-4" aria-label="Career plan progress">
      {steps.map((s) => {
        const isActive = s.key === active;
        const done = s.n < reached || (s.n === 3 && complete);
        const enabled = s.n <= reached;
        const inner = (
          <>
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-ink font-mono-label text-sm font-bold",
                isActive ? "bg-purple text-cream" : done ? "bg-lime" : "bg-white",
              )}
            >
              {done ? <Check className="size-4" strokeWidth={3} /> : s.n}
            </span>
            <span className="hidden text-sm font-bold sm:inline">{s.label}</span>
          </>
        );
        const base = cn(
          "flex items-center gap-3 rounded-2xl border-2 border-ink px-3 py-2.5",
          isActive ? "bg-white shadow-[3px_3px_0_var(--brand-ink)]" : "bg-cream-app",
          !enabled && "opacity-50",
        );
        return (
          <li key={s.key} aria-current={isActive ? "step" : undefined}>
            {enabled ? (
              <Link href={`/dashboard/career-plan/${planId}/${s.key}`} className={base}>
                {inner}
              </Link>
            ) : (
              <div className={base}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

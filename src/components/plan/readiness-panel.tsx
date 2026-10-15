"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { Readiness } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const tone = score >= 75 ? "var(--brand-success)" : score >= 50 ? "var(--brand-amber)" : "var(--brand-pink)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Readiness score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--brand-ink)" strokeOpacity={0.12} strokeWidth={12} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-extrabold leading-none">{score}</span>
        <span className="font-mono-label text-[10px] font-bold uppercase tracking-wider text-text-muted">of 100</span>
      </div>
    </div>
  );
}

/** Every point of the score, with the rule behind it — no black box. */
export function ChecksList({ checks }: { checks: Readiness["checks"] }) {
  return (
    <ul className="grid gap-2.5">
      {checks.map((c) => (
        <li key={c.id} className="rounded-xl border-2 border-ink bg-white p-3">
          <div className="flex items-start gap-2.5">
            {!c.assessed ? (
              <CircleDashed className="mt-0.5 size-4.5 shrink-0 text-text-muted" />
            ) : c.passed ? (
              <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-success" />
            ) : (
              <XCircle className="mt-0.5 size-4.5 shrink-0 text-pink-dark" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold">{c.label}</span>
                <span className={cn("font-mono-label text-xs font-bold", !c.assessed && "text-text-muted")}>
                  {c.assessed ? `${c.points}/${c.max_points}` : "skipped"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">{c.detail}</p>
              {c.tip && c.assessed && !c.passed && <p className="mt-1 text-xs font-semibold text-purple">{c.tip}</p>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

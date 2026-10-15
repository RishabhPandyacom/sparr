"use client";

import { AlertTriangle, CircleAlert, Lightbulb, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Finding, ResumeAnalysis, Severity } from "@/lib/resume/analysis";

/**
 * The score panel. Every point is traceable to a named check, and every failed
 * check says what to do and what it's worth — a number without a reason is
 * just a guilt trip.
 */
export function ScorePanel({
  analysis,
  onJump,
}: {
  analysis: ResumeAnalysis;
  onJump?: (sectionId: string) => void;
}) {
  const { score, grade, categories, findings, stats } = analysis;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-xl border bg-background p-4">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <p className="text-lg font-semibold leading-tight">{grade}</p>
          <p className="text-sm text-muted-foreground">
            {findings.length
              ? `${findings.length} thing${findings.length === 1 ? "" : "s"} worth fixing`
              : "Nothing left to flag. Ship it."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="Pages" value={String(stats.estimatedPages)} />
        <Stat label="Words" value={String(stats.words)} />
        <Stat
          label="Quantified bullets"
          value={`${stats.quantifiedPct}%`}
          tone={stats.quantifiedPct >= 50 ? "good" : stats.quantifiedPct >= 30 ? "warn" : "bad"}
        />
        <Stat
          label="Action verbs"
          value={`${stats.actionVerbPct}%`}
          tone={stats.actionVerbPct >= 70 ? "good" : stats.actionVerbPct >= 45 ? "warn" : "bad"}
        />
      </div>

      <section>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Breakdown
        </h4>
        <ul className="space-y-2.5">
          {categories.map((c) => {
            const pct = Math.round((c.score / c.max) * 100);
            return (
              <li key={c.key}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {Math.round(c.score)}/{c.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct >= 80 ? "bg-emerald-500" : pct >= 55 ? "bg-amber-500" : "bg-rose-500",
                    )}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.summary}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {!!findings.length && (
        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fix these
          </h4>
          <ul className="space-y-2">
            {findings.map((f) => (
              <FindingRow key={f.id} finding={f} onJump={onJump} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FindingRow({ finding, onJump }: { finding: Finding; onJump?: (id: string) => void }) {
  const Icon =
    finding.severity === "critical"
      ? CircleAlert
      : finding.severity === "warning"
        ? AlertTriangle
        : Lightbulb;

  const body = (
    <>
      <Icon className={cn("mt-0.5 size-4 shrink-0", toneClass(finding.severity))} />
      <span className="min-w-0">
        <span className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{finding.title}</span>
          {finding.cost > 0 && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              +{finding.cost}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {finding.detail}
        </span>
      </span>
    </>
  );

  return (
    <li>
      {finding.sectionId && onJump ? (
        <button
          type="button"
          onClick={() => onJump(finding.sectionId!)}
          className="flex w-full gap-2 rounded-lg border bg-background p-2.5 text-left transition-colors hover:border-foreground/25 hover:bg-muted/40"
        >
          {body}
        </button>
      ) : (
        <div className="flex gap-2 rounded-lg border bg-background p-2.5">{body}</div>
      )}
    </li>
  );
}

const toneClass = (s: Severity) =>
  s === "critical" ? "text-rose-500" : s === "warning" ? "text-amber-500" : "text-sky-500";

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  return (
    <div className="rounded-lg border bg-background p-2.5">
      <p
        className={cn(
          "text-lg font-semibold tabular-nums leading-tight",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "bad" && "text-rose-600 dark:text-rose-400",
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  const stroke =
    score >= 88 ? "#10b981" : score >= 72 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`Score ${score} of 100`}>
        <circle cx="34" cy="34" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          strokeWidth="6"
          stroke={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 34 34)"
          style={{ transition: "stroke-dashoffset 400ms ease, stroke 300ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums">
        {score}
      </span>
    </div>
  );
}

export function EmptyScoreHint() {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <FileText className="size-4" />
      Start typing and the score updates as you go.
    </p>
  );
}

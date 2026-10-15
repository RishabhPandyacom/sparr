"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Clock, Copy, Pencil, RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { CareerPlan, PlanStep } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionButton, FormBanner } from "./form-kit";
import { ChecksList, ScoreRing } from "./readiness-panel";
import { SalaryRange } from "./salary-range";

const HORIZONS = ["This week", "Next 2 weeks", "Before an offer"];
const priorityStyle: Record<PlanStep["priority"], string> = {
  high: "bg-pink text-white",
  medium: "bg-amber text-ink",
  low: "bg-cyan text-ink",
};

export function SummaryView({ plan }: { plan: CareerPlan }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const g = plan.plan;

  async function regenerate() {
    setPending(true);
    setError(null);
    try {
      await api(`/api/career-plans/${plan.id}/generate`, { method: "POST" });
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not build your plan.");
    } finally {
      setPending(false);
    }
  }

  if (!g) {
    return (
      <div className="rounded-2xl border-2 border-ink bg-white p-8 text-center shadow-[4px_4px_0_var(--brand-ink)]">
        <h2 className="font-display text-2xl font-extrabold">Ready to build your plan?</h2>
        <p className="mx-auto mt-2 max-w-md text-text-secondary">
          We’ll combine your résumé score, salary range and script into one action plan.
        </p>
        {error && <div className="mx-auto mt-4 max-w-md"><FormBanner tone="error">{error}</FormBanner></div>}
        <div className="mt-6 flex justify-center">
          <ActionButton onClick={regenerate} pending={pending} pendingLabel="Building…">
            Build my plan <ArrowRight />
          </ActionButton>
        </div>
      </div>
    );
  }

  async function copyScript() {
    try {
      await navigator.clipboard.writeText(g!.script.lines.join("\n\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard can be blocked; the text is still on screen */
    }
  }

  return (
    <div className="grid gap-8">
      <section className="beam-card rounded-3xl">
        <div className="flex flex-col gap-6 rounded-3xl bg-ink p-6 text-cream sm:flex-row sm:items-center sm:p-8">
          <div className="w-fit shrink-0 rounded-full bg-cream p-2 text-ink"><ScoreRing score={g.readiness.score} size={140} /></div>
          <div className="min-w-0">
            <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-lime">Your career summary</span>
            <h2 className="mt-1 text-balance font-display text-2xl font-extrabold leading-tight sm:text-3xl">{g.headline}</h2>
            <p className="mt-2 text-sm text-cream/70">
              Rule-based and traceable: each point below maps to a named check you can read and change.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" render={<Link href={`/dashboard/career-plan/${plan.id}/resume`} />}>
                <Pencil /> Edit inputs
              </Button>
              <Button variant="outline" onClick={regenerate} disabled={pending}>
                <RefreshCw className={pending ? "animate-spin" : ""} /> Regenerate
              </Button>
            </div>
          </div>
        </div>
      </section>
      {error && <FormBanner tone="error">{error}</FormBanner>}

      <section>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Your action plan</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          {HORIZONS.map((h) => {
            const steps = g.steps.filter((s) => s.horizon === h);
            return (
              <div key={h}>
                <h3 className="mb-3 font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-purple">{h}</h3>
                <ul className="grid gap-3">
                  {steps.length === 0 && <li className="rounded-xl border-2 border-dashed border-ink/30 p-3 text-sm text-text-muted">Nothing here.</li>}
                  {steps.map((s) => (
                    <li key={s.id}>
                      <Link href={s.href} className="block rounded-2xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_var(--brand-ink)] transition hover:-translate-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("rounded-full border-2 border-ink px-2 py-0.5 font-mono-label text-[10px] font-bold uppercase", priorityStyle[s.priority])}>{s.priority}</span>
                          <span className="flex items-center gap-1 text-xs text-text-muted"><Clock className="size-3" />{s.est_minutes} min</span>
                        </div>
                        <div className="mt-2 text-sm font-bold leading-snug">{s.title}</div>
                        <p className="mt-1 text-xs text-text-secondary">{s.why}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Résumé readiness, line by line</h2>
          <div className="mt-4"><ChecksList checks={g.readiness.checks} /></div>
          {g.readiness.missing_skills.length > 0 && (
            <div className="mt-4 rounded-xl border-2 border-ink bg-cream p-4">
              <div className="text-sm font-bold">Skills worth adding if you genuinely have them</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.readiness.missing_skills.slice(0, 12).map((s) => (
                  <span key={s} className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-xs font-semibold">{s}</span>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">Salary range</h2>
          <div className="mt-2"><SalaryRange estimate={g.salary} /></div>
        </section>
      </div>

      <section className="rounded-2xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_var(--brand-ink)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Your negotiation script</h2>
            <p className="text-sm text-text-secondary">{g.script.style_label}</p>
          </div>
          <Button variant="outline" onClick={copyScript}>
            {copied ? <><Check /> Copied</> : <><Copy /> Copy script</>}
          </Button>
        </div>
        <ol className="mt-5 grid gap-3">
          {g.script.lines.map((l, i) => (
            <li key={i} className="flex gap-3 rounded-xl border-2 border-ink bg-cream p-3.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-lime font-mono-label text-xs font-bold">{i + 1}</span>
              <span className="text-sm leading-relaxed">{l}</span>
            </li>
          ))}
        </ol>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-bold">Tips</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-text-secondary">{g.script.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div>
            <h3 className="font-bold">If they say no</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-text-secondary">{g.script.if_they_say_no.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </section>

      <p className="rounded-xl border-2 border-dashed border-ink/40 p-4 text-xs text-text-secondary">{g.disclaimer}</p>
    </div>
  );
}

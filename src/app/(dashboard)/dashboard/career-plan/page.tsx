import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { apiServer } from "@/lib/api/server";
import type { CareerPlan } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { NewPlanButton } from "@/components/plan/new-plan-button";
import { DeletePlanButton } from "@/components/plan/delete-plan-button";
import { ScoreRing } from "@/components/plan/readiness-panel";
import { ApiDown } from "@/components/plan/api-down";

export const metadata = { title: "Career plan — Sparr" };

export default async function CareerPlanHub() {
  const plans = await apiServer<CareerPlan[]>("/api/career-plans");
  if (!plans) return <ApiDown />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Start here"
        title="Career plan"
        description="Résumé, salary and a negotiation script, joined into one action plan. Saved to your account."
      >
        {plans.length > 0 && <NewPlanButton label="New plan" />}
      </PageHeader>

      {plans.length === 0 ? (
        <div className="rounded-3xl border-2 border-ink bg-white p-10 text-center shadow-[6px_6px_0_var(--brand-ink)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border-2 border-ink bg-lime shadow-[3px_3px_0_var(--brand-ink)]">
            <Target className="size-7" />
          </span>
          <h2 className="mt-5 font-display text-2xl font-extrabold">No plan yet</h2>
          <p className="mx-auto mt-2 max-w-md text-text-secondary">
            Answer a few questions about your résumé and pay. In about five minutes you’ll have a readiness score,
            a salary range and a step-by-step plan.
          </p>
          <div className="mt-6 flex justify-center"><NewPlanButton /></div>
        </div>
      ) : (
        <ul className="grid gap-4">
          {plans.map((p) => {
            const step = p.status === "complete" ? "summary" : ["resume", "salary", "summary"][p.current_step - 1];
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-5 rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)]">
                {p.readiness_score != null ? <ScoreRing score={p.readiness_score} size={76} /> : (
                  <span className="flex size-[76px] items-center justify-center rounded-full border-2 border-dashed border-ink/40 font-mono-label text-xs text-text-muted">draft</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-extrabold">{p.title}</div>
                  <div className="text-sm text-text-secondary">
                    {p.resume_data.target_role ?? "No target role yet"} · {p.status === "complete" ? "Complete" : `Step ${p.current_step} of 3`} · updated{" "}
                    {new Date(p.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <Link href={`/dashboard/career-plan/${p.id}/${step}`} className="inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-purple px-4 py-2 text-sm font-bold text-cream shadow-[3px_3px_0_var(--brand-ink)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_var(--brand-ink)]">
                  {p.status === "complete" ? "Open" : "Continue"} <ArrowRight className="size-4" />
                </Link>
                <DeletePlanButton id={p.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

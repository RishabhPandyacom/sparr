import Link from "next/link";
import {
  FileText,
  Mail,
  MessageSquareCode,
  Calculator,
  ArrowRight,
  Target,
  KanbanSquare,
} from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { apiServer } from "@/lib/api/server";
import type { Application, CareerPlan } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreRing } from "@/components/plan/readiness-panel";
import { NewPlanButton } from "@/components/plan/new-plan-button";

const quickActions = [
  { title: "Résumé studio", description: "Type a role, get a full first draft.", href: "/dashboard/resumes/generate", icon: FileText, tint: "bg-pink" },
  { title: "Cover letter", description: "Structured around any job description.", href: "/dashboard/cover-letters/new", icon: Mail, tint: "bg-cyan" },
  { title: "Mock interview", description: "Chat, MCQ or coding rounds.", href: "/dashboard/interviews/new", icon: MessageSquareCode, tint: "bg-purple text-cream" },
  { title: "Salary negotiator", description: "Know your range before you talk.", href: "/dashboard/salary-negotiator", icon: Calculator, tint: "bg-amber" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: profile }, { data: usage }, plan, apps] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("usage_credits")
      .select("interviews_used, interviews_limit")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    apiServer<CareerPlan | null>("/api/career-plans/latest"),
    apiServer<Application[]>("/api/applications"),
  ]);

  const firstName = (profile?.full_name || "").split(" ")[0] || "there";
  const used = usage?.interviews_used ?? 0;
  const limit = usage?.interviews_limit ?? 3;
  const unlimited = limit === -1;
  const appList = apps ?? [];
  const count = (s: Application["status"]) => appList.filter((a) => a.status === s).length;
  const nextStep = plan?.plan?.steps?.[0];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader eyebrow="Dashboard" title={`Welcome back, ${firstName}`} description="Your plan, your pipeline and your practice, in one place." />

      <section className="beam-card rounded-3xl">
        <div className="flex flex-col gap-6 rounded-3xl bg-ink p-6 text-cream sm:flex-row sm:items-center sm:p-8">
          {plan?.readiness_score != null && plan.plan ? (
            <>
              <div className="w-fit shrink-0 rounded-full bg-cream p-2 text-ink"><ScoreRing score={plan.readiness_score} size={120} /></div>
              <div className="min-w-0 flex-1">
                <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-lime">Latest career plan · {plan.title}</span>
                <h2 className="mt-1 text-balance font-display text-2xl font-extrabold leading-tight">{plan.plan.headline}</h2>
                {nextStep && <p className="mt-2 text-sm text-cream/70">Next up: {nextStep.title}</p>}
                <Link href={`/dashboard/career-plan/${plan.id}/summary`} className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-cream bg-lime px-4 py-2 text-sm font-bold text-ink shadow-[3px_3px_0_var(--brand-purple)]">
                  Open my plan <ArrowRight className="size-4" />
                </Link>
              </div>
            </>
          ) : (
            <>
              <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 border-cream bg-lime text-ink"><Target className="size-9" /></span>
              <div className="min-w-0 flex-1">
                <span className="font-mono-label text-xs font-bold uppercase tracking-[0.14em] text-lime">Start here</span>
                <h2 className="mt-1 font-display text-2xl font-extrabold leading-tight">Build your career plan in about five minutes.</h2>
                <p className="mt-2 text-sm text-cream/70">A readiness score, a salary range and a negotiation script, saved to your account.</p>
                <div className="mt-4"><NewPlanButton /></div>
              </div>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/applications" className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)] transition hover:-translate-y-0.5">
          <KanbanSquare className="size-5 text-purple" />
          <div className="mt-3 font-display text-3xl font-extrabold">{appList.length}</div>
          <div className="text-sm font-semibold">Applications tracked</div>
          <div className="text-xs text-text-secondary">{count("applied")} applied · {count("interviewing")} interviewing · {count("offer")} offers</div>
        </Link>
        <div className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)]">
          <MessageSquareCode className="size-5 text-purple" />
          <div className="mt-3 font-display text-3xl font-extrabold">{unlimited ? "∞" : `${used}/${limit}`}</div>
          <div className="text-sm font-semibold">Mock interviews used</div>
          <div className="text-xs text-text-secondary">{unlimited ? "Unlimited on your plan." : "This billing period."}</div>
        </div>
        <Link href="/dashboard/career-plan" className="rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)] transition hover:-translate-y-0.5">
          <Target className="size-5 text-purple" />
          <div className="mt-3 font-display text-3xl font-extrabold">{plan?.readiness_score ?? "—"}</div>
          <div className="text-sm font-semibold">Readiness score</div>
          <div className="text-xs text-text-secondary">{plan?.plan ? plan.plan.band : "Not scored yet"}</div>
        </Link>
      </div>

      <div>
        <h2 className="mb-4 font-display text-xl font-extrabold">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_var(--brand-ink)] transition hover:-translate-y-0.5">
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink ${a.tint}`}><a.icon className="size-5" /></span>
              <span>
                <span className="block font-display text-lg font-extrabold leading-tight">{a.title}</span>
                <span className="text-sm text-text-secondary">{a.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import { apiServer } from "@/lib/api/server";
import type { CareerPlan } from "@/lib/api/types";
import { StepProgress } from "@/components/plan/step-progress";
import { PageHeader } from "@/components/layout/page-header";
import { ApiDown } from "@/components/plan/api-down";

export default async function PlanLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const plan = await apiServer<CareerPlan>(`/api/career-plans/${id}`);
  if (!plan) return <ApiDown />;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Career plan"
        title={plan.title}
        description="Three short steps. Each one saves as you go, so you can leave and come back."
      />
      <StepProgress planId={plan.id} reached={plan.current_step} complete={plan.status === "complete"} />
      {children}
    </div>
  );
}

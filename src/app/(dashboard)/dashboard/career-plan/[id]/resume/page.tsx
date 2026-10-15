import { apiServer } from "@/lib/api/server";
import type { CareerPlan } from "@/lib/api/types";
import { ResumeStep } from "@/components/plan/resume-step";
import { ApiDown } from "@/components/plan/api-down";

export default async function ResumePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await apiServer<CareerPlan>(`/api/career-plans/${id}`);
  if (!plan) return <ApiDown />;
  return <ResumeStep plan={plan} />;
}

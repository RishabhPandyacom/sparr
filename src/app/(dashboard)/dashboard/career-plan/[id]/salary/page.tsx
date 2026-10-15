import { apiServer } from "@/lib/api/server";
import type { CareerPlan } from "@/lib/api/types";
import { SalaryStep } from "@/components/plan/salary-step";
import { ApiDown } from "@/components/plan/api-down";

export default async function SalaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await apiServer<CareerPlan>(`/api/career-plans/${id}`);
  if (!plan) return <ApiDown />;
  return <SalaryStep plan={plan} />;
}

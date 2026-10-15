import { apiServer } from "@/lib/api/server";
import type { CareerPlan } from "@/lib/api/types";
import { SummaryView } from "@/components/plan/summary-view";
import { ApiDown } from "@/components/plan/api-down";

export default async function SummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await apiServer<CareerPlan>(`/api/career-plans/${id}`);
  if (!plan) return <ApiDown />;
  return <SummaryView plan={plan} />;
}

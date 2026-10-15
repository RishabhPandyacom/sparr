import { redirect } from "next/navigation";
import { apiServer } from "@/lib/api/server";
import type { CareerPlan } from "@/lib/api/types";

export default async function PlanIndex({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await apiServer<CareerPlan>(`/api/career-plans/${id}`);
  const step = plan?.status === "complete" ? "summary" : ["resume", "salary", "summary"][(plan?.current_step ?? 1) - 1];
  redirect(`/dashboard/career-plan/${id}/${step}`);
}

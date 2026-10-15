"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api/client";
import type { CareerPlan } from "@/lib/api/types";
import { ActionButton } from "./form-kit";

export function NewPlanButton({ label = "Start a career plan" }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function create() {
    setPending(true);
    setError(null);
    try {
      const plan = await api<CareerPlan>("/api/career-plans", { method: "POST", json: {} });
      router.push(`/dashboard/career-plan/${plan.id}/resume`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not start a plan.");
      setPending(false);
    }
  }
  return (
    <div>
      <ActionButton onClick={create} pending={pending} pendingLabel="Starting…">
        <Plus /> {label}
      </ActionButton>
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-pink-dark">{error}</p>}
    </div>
  );
}

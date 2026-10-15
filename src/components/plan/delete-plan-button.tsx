"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";

export function DeletePlanButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  async function del() {
    setPending(true);
    try {
      await api(`/api/career-plans/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }
  return confirming ? (
    <span className="flex items-center gap-2">
      <Button size="sm" variant="destructive" onClick={del} disabled={pending}>Delete for good</Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
    </span>
  ) : (
    <Button size="icon" variant="ghost" aria-label="Delete plan" onClick={() => setConfirming(true)}>
      <Trash2 />
    </Button>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Shown when the Python API cannot be reached or the plan does not exist. */
export function ApiDown() {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border-2 border-ink bg-white p-8 text-center shadow-[5px_5px_0_var(--brand-ink)]">
      <h1 className="font-display text-2xl font-extrabold">We couldn’t load that</h1>
      <p className="mt-2 text-text-secondary">
        The plan may have been deleted, or the Sparr API is not reachable right now. Your data is safe.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button render={<Link href="/dashboard/career-plan" />}>Back to career plans</Button>
      </div>
    </div>
  );
}

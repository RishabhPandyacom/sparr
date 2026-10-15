import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  await requireUser();
  const { plan } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <CheckCircle2 className="size-14 text-emerald-500" />
          <div>
            <h1 className="text-xl font-semibold">You&apos;re all set! 🎉</h1>
            <p className="mt-1 text-muted-foreground">
              Your {plan ? `${plan} ` : ""}plan is active and your interview
              credits have been refreshed.
            </p>
          </div>
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            This was a simulated purchase — no real charge was made.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/billing">Back to billing</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/interviews/new">Start an interview</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

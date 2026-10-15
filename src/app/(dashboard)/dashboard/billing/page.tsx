import { AlertTriangle } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PricingCards, type Plan } from "@/components/billing/pricing-cards";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const { upgrade } = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: plans }, { data: sub }, { data: usage }] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("slug, name, price_cents, billing_interval, features")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("user_subscriptions")
      .select("plan_id, subscription_plans(slug, name)")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("usage_credits")
      .select("interviews_used, interviews_limit, period_end")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const currentPlan = sub?.subscription_plans as { slug?: string; name?: string } | null;
  const used = usage?.interviews_used ?? 0;
  const limit = usage?.interviews_limit ?? 3;
  const unlimited = limit === -1;
  const pct = unlimited ? 0 : Math.min(100, (used / Math.max(limit, 1)) * 100);
  const outOfCredits = !unlimited && used >= limit;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Billing & Plans"
        description="Manage your subscription and interview credits."
      />

      {upgrade && outOfCredits && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">You&apos;re out of interview credits</p>
            <p className="text-sm text-amber-800">
              Upgrade below to keep practicing. (This is a simulated checkout —
              no real charge.)
            </p>
          </div>
        </div>
      )}

      {/* Current usage */}
      <Card className="mb-8">
        <CardContent className="py-6">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <p className="text-lg font-semibold">
                {currentPlan?.name ?? "Free"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Interview credits</p>
              <p className="text-lg font-semibold">
                {unlimited ? "Unlimited" : `${used} / ${limit} used`}
              </p>
            </div>
          </div>
          {!unlimited && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(pct >= 100 ? "bg-amber-500" : "bg-primary", "h-full transition-all")}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-4 text-lg font-semibold">Choose a plan</h2>
      <PricingCards
        plans={(plans ?? []).map((p) => ({ ...p, features: (p.features as string[]) ?? [] })) as Plan[]}
        currentSlug={currentPlan?.slug ?? "free"}
      />
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Payments are simulated for now — no real charges. Stripe drops in behind
        the same flow later.
      </p>
    </div>
  );
}

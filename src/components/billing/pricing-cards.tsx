import { Check } from "lucide-react";
import { simulatePurchase } from "@/lib/billing/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Plan = {
  slug: string;
  name: string;
  price_cents: number;
  billing_interval: string;
  features: string[];
};

function formatPrice(cents: number, interval: string) {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}/${interval === "year" ? "yr" : "mo"}`;
}

/** Plan cards with mock "Simulate purchase". `currentSlug` marks the active plan. */
export function PricingCards({
  plans,
  currentSlug,
  ctaSignedIn = true,
}: {
  plans: Plan[];
  currentSlug?: string;
  ctaSignedIn?: boolean;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.slug === currentSlug;
        const featured = plan.slug === "pro";
        return (
          <div
            key={plan.slug}
            className={cn(
              "flex flex-col rounded-2xl border bg-background p-6",
              featured && "border-primary shadow-md ring-1 ring-primary",
            )}
          >
            {featured && (
              <span className="mb-2 w-fit rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-1 text-3xl font-bold">
              {formatPrice(plan.price_cents, plan.billing_interval)}
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {ctaSignedIn ? (
              <form action={simulatePurchase} className="mt-6">
                <input type="hidden" name="planSlug" value={plan.slug} />
                <Button
                  type="submit"
                  className="w-full"
                  variant={featured ? "default" : "outline"}
                  disabled={isCurrent}
                >
                  {isCurrent
                    ? "Current plan"
                    : plan.price_cents === 0
                      ? "Switch to Free"
                      : `Choose ${plan.name}`}
                </Button>
              </form>
            ) : (
              <Button
                asChild
                className="mt-6 w-full"
                variant={featured ? "default" : "outline"}
              >
                <a href="/signup">Get started</a>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}

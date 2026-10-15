import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOptionalUser } from "@/lib/auth/guards";
import { PricingCards, type Plan } from "@/components/billing/pricing-cards";
import { Button } from "@/components/ui/button";

export default async function PricingPage() {
  const supabase = await createClient();
  const [{ data: plans }, user] = await Promise.all([
    supabase
      .from("subscription_plans")
      .select("slug, name, price_cents, billing_interval, features")
      .eq("is_active", true)
      .order("sort_order"),
    getOptionalUser(),
  ]);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            Sparr
          </Link>
          <Button asChild>
            <Link href={user ? "/dashboard" : "/signup"}>
              {user ? "Dashboard" : "Get started"}
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing, priced by interviews
          </h1>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you&apos;re ready to go all in.
          </p>
        </div>
        <PricingCards
          plans={(plans ?? []).map((p) => ({ ...p, features: (p.features as string[]) ?? [] })) as Plan[]}
          ctaSignedIn={false}
        />
      </section>
    </div>
  );
}

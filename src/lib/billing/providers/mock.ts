import { createClient } from "@/lib/supabase/server";
import type { BillingProvider, CheckoutResult } from "../types";

/**
 * Mock billing provider. Simulates a successful purchase with NO real payment:
 * flips the user's plan and resets their interview credits for a fresh period.
 * Uses the request's authed client so RLS scopes writes to the current user.
 */
export class MockBillingProvider implements BillingProvider {
  readonly name = "mock";

  async createCheckoutSession(
    userId: string,
    planSlug: string,
  ): Promise<CheckoutResult> {
    const supabase = await createClient();

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("id, interview_credits_per_period")
      .eq("slug", planSlug)
      .single();
    if (!plan) throw new Error(`Unknown plan: ${planSlug}`);

    const reference = `mock_${crypto.randomUUID()}`;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Upsert the user's subscription (one active per user).
    await supabase
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan_id: plan.id,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          mock_payment_reference: reference,
        },
        { onConflict: "user_id" },
      );

    // Reset the current usage-credits row to the new plan's limit.
    const { data: usage } = await supabase
      .from("usage_credits")
      .select("id")
      .eq("user_id", userId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (usage) {
      await supabase
        .from("usage_credits")
        .update({
          interviews_used: 0,
          interviews_limit: plan.interview_credits_per_period,
          period_start: now.toISOString(),
          period_end: periodEnd.toISOString(),
        })
        .eq("id", usage.id);
    } else {
      await supabase.from("usage_credits").insert({
        user_id: userId,
        interviews_used: 0,
        interviews_limit: plan.interview_credits_per_period,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
      });
    }

    return {
      redirectUrl: `/dashboard/billing/success?plan=${planSlug}`,
      reference,
    };
  }
}

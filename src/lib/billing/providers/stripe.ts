import type { BillingProvider, CheckoutResult } from "../types";

/**
 * Stripe billing provider — STUB. Not implemented yet.
 *
 * To activate later:
 *   1. `npm install stripe`
 *   2. Set STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in env, BILLING_PROVIDER=stripe
 *   3. Implement createCheckoutSession with stripe.checkout.sessions.create(...)
 *      returning the real hosted-checkout URL. Handle the checkout.session
 *      .completed webhook (app/api/billing/webhook) to flip the plan + reset
 *      usage_credits — the same DB writes the mock provider does inline.
 *
 * Nothing else changes: the UI and schema already speak this interface.
 */
export class StripeBillingProvider implements BillingProvider {
  readonly name = "stripe";

  async createCheckoutSession(): Promise<CheckoutResult> {
    throw new Error(
      "StripeBillingProvider is not implemented yet. See src/lib/billing/providers/stripe.ts.",
    );
  }
}

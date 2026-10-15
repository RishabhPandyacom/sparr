/**
 * Provider-agnostic billing interface. The app uses a mock provider today
 * (no real charges); a real Stripe provider can be dropped in behind this same
 * contract without touching UI or schema — see providers/stripe.ts.
 */

export type CheckoutResult = {
  /** Where to send the user next (a real provider returns Stripe's URL). */
  redirectUrl: string;
  reference: string;
};

export interface BillingProvider {
  readonly name: string;
  /**
   * "Purchase" a plan for a user. The mock provider performs the plan change
   * and credit reset directly and returns a local success URL.
   */
  createCheckoutSession(userId: string, planSlug: string): Promise<CheckoutResult>;
}

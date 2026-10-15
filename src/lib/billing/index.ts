import "server-only";
import type { BillingProvider } from "./types";
import { MockBillingProvider } from "./providers/mock";
import { StripeBillingProvider } from "./providers/stripe";

let cached: BillingProvider | null = null;

/**
 * Returns the configured billing provider. Reads BILLING_PROVIDER
 * (mock | stripe); defaults to `mock` (no real charges). Server-only.
 */
export function getBillingProvider(): BillingProvider {
  if (cached) return cached;
  const which = (process.env.BILLING_PROVIDER ?? "mock").toLowerCase();
  cached = which === "stripe" ? new StripeBillingProvider() : new MockBillingProvider();
  return cached;
}

export type { BillingProvider } from "./types";

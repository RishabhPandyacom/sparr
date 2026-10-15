/**
 * Transparent, rule-based salary estimator. Uses coarse public-ballpark
 * baselines (USD) — clearly an estimate, not live market data. A real market-
 * data source can replace `roleBaselines` / `locationMultipliers` later without
 * changing the consumer UI.
 */

export type SalaryInputs = {
  role: string;
  location: string;
  experienceYears: number;
  currentOffer?: number;
};

export type SalaryEstimate = {
  marketLow: number;
  marketMid: number;
  marketHigh: number;
  recommendedAsk: number;
  currency: string;
};

// Base mid-level (≈3 yrs) total comp ballparks by role keyword, USD.
const roleBaselines: { match: string[]; base: number }[] = [
  { match: ["staff", "principal", "architect"], base: 210000 },
  { match: ["senior", "sr", "lead"], base: 170000 },
  { match: ["machine learning", "ml", "ai engineer", "data scientist"], base: 165000 },
  { match: ["software", "engineer", "developer", "swe", "frontend", "backend", "full"], base: 135000 },
  { match: ["product manager", "pm"], base: 140000 },
  { match: ["designer", "ux", "ui"], base: 115000 },
  { match: ["data analyst", "analyst"], base: 95000 },
  { match: ["marketing", "sales", "content"], base: 85000 },
  { match: ["intern"], base: 55000 },
];

// Cost-of-living / market multipliers by location keyword.
const locationMultipliers: { match: string[]; mult: number }[] = [
  { match: ["san francisco", "bay area", "sf", "palo alto", "mountain view"], mult: 1.35 },
  { match: ["new york", "nyc", "manhattan"], mult: 1.25 },
  { match: ["seattle", "boston", "los angeles", "la"], mult: 1.15 },
  { match: ["austin", "denver", "chicago"], mult: 1.05 },
  { match: ["remote"], mult: 1.0 },
  { match: ["london"], mult: 0.95 },
  { match: ["bangalore", "bengaluru", "india", "delhi", "mumbai"], mult: 0.35 },
];

function baseForRole(role: string): number {
  const r = role.toLowerCase();
  for (const { match, base } of roleBaselines) {
    if (match.some((m) => r.includes(m))) return base;
  }
  return 110000; // sensible default
}

function multForLocation(location: string): number {
  const l = location.toLowerCase();
  for (const { match, mult } of locationMultipliers) {
    if (match.some((m) => l.includes(m))) return mult;
  }
  return 1.0;
}

/** Experience multiplier: ~+6%/yr, gently capped. */
function expMultiplier(years: number): number {
  const y = Math.max(0, Math.min(years, 15));
  return 1 + (y - 3) * 0.06;
}

export function estimateSalary(inputs: SalaryInputs): SalaryEstimate {
  const base = baseForRole(inputs.role || "");
  const adjusted = base * multForLocation(inputs.location || "") * expMultiplier(inputs.experienceYears || 0);

  const marketMid = Math.round(adjusted / 1000) * 1000;
  const marketLow = Math.round((marketMid * 0.85) / 1000) * 1000;
  const marketHigh = Math.round((marketMid * 1.2) / 1000) * 1000;

  // Recommend asking for the higher of (offer +10%) and market mid+.
  const offerAsk = inputs.currentOffer ? inputs.currentOffer * 1.1 : 0;
  const marketAsk = marketMid * 1.08;
  const recommendedAsk = Math.round(Math.max(offerAsk, marketAsk) / 1000) * 1000;

  return { marketLow, marketMid, marketHigh, recommendedAsk, currency: "USD" };
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

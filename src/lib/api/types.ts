/** Shapes returned by the Sparr Python API (backend/app). */

export type Currency = "AUD" | "USD" | "GBP";
export type Strategy = "collaborative" | "data_driven" | "assertive" | "flexible";
export type AppStatus = "wishlist" | "applied" | "interviewing" | "offer" | "rejected";

export type ResumeData = {
  target_role: string;
  key_skills: string;
  experience: string;
  years_experience: number;
  job_description: string | null;
};

export type SalaryData = {
  current_offer: number | null;
  target_salary: number;
  location: string;
  currency: Currency;
  strategy: Strategy;
};

export type ReadinessCheck = {
  id: string;
  label: string;
  points: number;
  max_points: number;
  passed: boolean;
  detail: string;
  tip: string | null;
  assessed: boolean;
};

export type Readiness = {
  score: number;
  band: string;
  role_family: string;
  role_matched: boolean;
  checks: ReadinessCheck[];
  matched_skills: string[];
  missing_skills: string[];
  jd_keywords_missing: string[];
};

export type SalaryEstimate = {
  currency: Currency;
  low: number;
  mid: number;
  high: number;
  recommended_ask: number;
  walk_away: number;
  market: string;
  role_family: string;
  target_position: "below" | "within" | "above" | null;
  target_comment: string | null;
  offer_position: "below" | "within" | "above" | null;
  offer_comment: string | null;
  breakdown: { label: string; value: string; effect: string }[];
  assumptions: string[];
};

export type NegotiationScript = {
  style: Strategy;
  style_label: string;
  lines: string[];
  tips: string[];
  if_they_say_no: string[];
};

export type PlanStep = {
  id: string;
  title: string;
  why: string;
  horizon: string;
  priority: "high" | "medium" | "low";
  href: string;
  est_minutes: number;
  order: number;
};

export type GeneratedPlan = {
  method: "rule-based";
  headline: string;
  band: string;
  readiness: Readiness;
  salary: SalaryEstimate;
  script: NegotiationScript;
  steps: PlanStep[];
  disclaimer: string;
};

export type CareerPlan = {
  id: string;
  user_id: string;
  title: string;
  status: "draft" | "complete";
  current_step: 1 | 2 | 3;
  resume_data: Partial<ResumeData>;
  salary_data: Partial<SalaryData>;
  plan: GeneratedPlan | null;
  readiness_score: number | null;
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  job_url: string | null;
  location: string | null;
  notes: string | null;
  applied_on: string | null;
  created_at: string;
  updated_at: string;
};

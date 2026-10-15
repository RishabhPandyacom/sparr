-- ============================================================================
-- Seed data: subscription plans
-- Idempotent via ON CONFLICT so re-running is safe.
--
-- The résumé/CV template catalogue is NOT seeded here — it lives in
-- src/lib/resume/design.ts (the runtime source of truth) and is mirrored into
-- public.resume_templates by migration 0004. Seeding it in both places would
-- let the two drift.
-- ============================================================================

-- ---- subscription plans ----------------------------------------------------
insert into public.subscription_plans
  (slug, name, price_cents, billing_interval, interview_credits_per_period, features, is_active, sort_order)
values
  ('free', 'Free', 0, 'month', 3,
   '["3 mock interviews / month", "Resume builder (5 templates)", "1 cover letter / month", "Salary calculator"]'::jsonb,
   true, 0),
  ('pro', 'Pro', 1900, 'month', 30,
   '["30 mock interviews / month", "All resume templates + PDF export", "Unlimited cover letters", "Coding & MCQ interview rounds", "Priority AI feedback"]'::jsonb,
   true, 1),
  ('premium', 'Premium', 4900, 'month', -1,
   '["Unlimited mock interviews", "Everything in Pro", "Early access to Auto-Apply Job Board", "Salary negotiation scripts", "Email + push reminders"]'::jsonb,
   true, 2)
on conflict (slug) do update
  set name = excluded.name,
      price_cents = excluded.price_cents,
      billing_interval = excluded.billing_interval,
      interview_credits_per_period = excluded.interview_credits_per_period,
      features = excluded.features,
      is_active = excluded.is_active,
      sort_order = excluded.sort_order;

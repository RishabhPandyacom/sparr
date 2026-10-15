-- ============================================================================
-- Extend waitlist_signups with the richer landing-page waitlist form fields:
-- pronouns (optional identity field), stage (where they are in the job hunt),
-- and goals (what they want help with first, multi-select).
-- ============================================================================

alter table public.waitlist_signups
  add column if not exists pronouns text,
  add column if not exists stage text,
  add column if not exists goals text[] not null default '{}';

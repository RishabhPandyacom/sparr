-- ============================================================================
-- Row Level Security policies
-- Pattern: user-owned rows scoped to auth.uid(); public catalogs read-only;
-- waitlist allows anonymous insert.
-- ============================================================================

-- Enable RLS everywhere.
alter table public.profiles              enable row level security;
alter table public.resume_templates      enable row level security;
alter table public.resumes               enable row level security;
alter table public.cover_letters         enable row level security;
alter table public.interview_sessions    enable row level security;
alter table public.interview_questions   enable row level security;
alter table public.interview_answers     enable row level security;
alter table public.coding_submissions    enable row level security;
alter table public.waitlist_signups      enable row level security;
alter table public.notifications         enable row level security;
alter table public.subscription_plans    enable row level security;
alter table public.user_subscriptions    enable row level security;
alter table public.usage_credits         enable row level security;

-- ---- profiles -------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- ---- public catalogs (read-only for authenticated + anon) -----------------
create policy "resume_templates_read" on public.resume_templates
  for select using (true);
create policy "subscription_plans_read" on public.subscription_plans
  for select using (true);

-- ---- resumes --------------------------------------------------------------
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

-- ---- cover_letters --------------------------------------------------------
create policy "cover_letters_select_own" on public.cover_letters
  for select using (auth.uid() = user_id);
create policy "cover_letters_insert_own" on public.cover_letters
  for insert with check (auth.uid() = user_id);
create policy "cover_letters_update_own" on public.cover_letters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cover_letters_delete_own" on public.cover_letters
  for delete using (auth.uid() = user_id);

-- ---- interview_sessions ---------------------------------------------------
create policy "interview_sessions_select_own" on public.interview_sessions
  for select using (auth.uid() = user_id);
create policy "interview_sessions_insert_own" on public.interview_sessions
  for insert with check (auth.uid() = user_id);
create policy "interview_sessions_update_own" on public.interview_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "interview_sessions_delete_own" on public.interview_sessions
  for delete using (auth.uid() = user_id);

-- ---- interview_questions (owned via parent session) -----------------------
create policy "interview_questions_select_own" on public.interview_questions
  for select using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));
create policy "interview_questions_insert_own" on public.interview_questions
  for insert with check (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));
create policy "interview_questions_update_own" on public.interview_questions
  for update using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));

-- ---- interview_answers ----------------------------------------------------
create policy "interview_answers_select_own" on public.interview_answers
  for select using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));
create policy "interview_answers_insert_own" on public.interview_answers
  for insert with check (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));
create policy "interview_answers_update_own" on public.interview_answers
  for update using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));

-- ---- coding_submissions ---------------------------------------------------
create policy "coding_submissions_select_own" on public.coding_submissions
  for select using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));
create policy "coding_submissions_insert_own" on public.coding_submissions
  for insert with check (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));
create policy "coding_submissions_update_own" on public.coding_submissions
  for update using (exists (
    select 1 from public.interview_sessions s
    where s.id = session_id and s.user_id = auth.uid()));

-- ---- waitlist_signups (public/anon insert; no public read) ----------------
create policy "waitlist_insert_anon" on public.waitlist_signups
  for insert with check (true);
create policy "waitlist_select_own" on public.waitlist_signups
  for select using (auth.uid() = user_id);

-- ---- notifications --------------------------------------------------------
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);

-- ---- user_subscriptions ---------------------------------------------------
create policy "user_subscriptions_select_own" on public.user_subscriptions
  for select using (auth.uid() = user_id);
create policy "user_subscriptions_insert_own" on public.user_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "user_subscriptions_update_own" on public.user_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- usage_credits --------------------------------------------------------
create policy "usage_credits_select_own" on public.usage_credits
  for select using (auth.uid() = user_id);
create policy "usage_credits_insert_own" on public.usage_credits
  for insert with check (auth.uid() = user_id);
create policy "usage_credits_update_own" on public.usage_credits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

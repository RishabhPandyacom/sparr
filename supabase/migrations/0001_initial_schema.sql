-- ============================================================================
-- AI Co-pilot for Students — initial schema
-- All user-owned tables carry user_id and are protected by RLS (see 0002).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: 1:1 extension of auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  headline text,
  target_role text,
  resume_context jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- resume_templates: seeded public catalog (see seed.sql)
-- ---------------------------------------------------------------------------
create table public.resume_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  preview_image_url text,
  layout_key text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- resumes: user resumes; content is the canonical structured jsonb every
-- template renders from.
-- ---------------------------------------------------------------------------
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid references public.resume_templates (id),
  title text not null default 'Untitled Resume',
  content jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resumes_user_id_idx on public.resumes (user_id);

-- ---------------------------------------------------------------------------
-- cover_letters
-- ---------------------------------------------------------------------------
create table public.cover_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  title text not null default 'Untitled Cover Letter',
  job_description text,
  company_name text,
  generated_content text,
  edited_content text,
  ai_provider text,
  ai_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cover_letters_user_id_idx on public.cover_letters (user_id);

-- ---------------------------------------------------------------------------
-- interview_sessions
-- ---------------------------------------------------------------------------
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('chat', 'mcq', 'coding')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed', 'abandoned')),
  topic text,
  difficulty text,
  time_limit_seconds int,
  started_at timestamptz,
  completed_at timestamptz,
  total_score numeric,
  max_score numeric,
  summary_feedback text,
  credits_consumed int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index interview_sessions_user_id_idx on public.interview_sessions (user_id);

-- ---------------------------------------------------------------------------
-- interview_questions
-- ---------------------------------------------------------------------------
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  sequence_number int not null,
  question_type text not null check (question_type in ('chat', 'mcq', 'coding')),
  prompt text not null,
  options jsonb,
  correct_option_key text,
  starter_code text,
  language text,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);
create index interview_questions_session_id_idx on public.interview_questions (session_id);

-- ---------------------------------------------------------------------------
-- interview_answers
-- ---------------------------------------------------------------------------
create table public.interview_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.interview_questions (id) on delete cascade,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  answer_text text,
  selected_option_key text,
  is_correct boolean,
  ai_feedback text,
  score numeric,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index interview_answers_session_id_idx on public.interview_answers (session_id);

-- ---------------------------------------------------------------------------
-- coding_submissions: kept separate for richer AI-review metadata.
-- No real execution/sandbox — grading is AI-review-only.
-- ---------------------------------------------------------------------------
create table public.coding_submissions (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.interview_questions (id) on delete cascade,
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  code text not null,
  language text not null,
  ai_review text,
  ai_score numeric,
  ai_strengths jsonb,
  ai_issues jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index coding_submissions_session_id_idx on public.coding_submissions (session_id);

-- ---------------------------------------------------------------------------
-- waitlist_signups: public insert allowed (see RLS); job board is waitlist-only.
-- ---------------------------------------------------------------------------
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  linkedin_url text,
  user_id uuid references public.profiles (id) on delete set null,
  source text not null default 'job_board',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'system',
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  scheduled_for timestamptz,
  delivered_at timestamptz,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'push')),
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on public.notifications (user_id);

-- ---------------------------------------------------------------------------
-- subscription_plans: seeded public catalog (see seed.sql)
-- ---------------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_cents int not null default 0,
  billing_interval text not null default 'month'
    check (billing_interval in ('month', 'year', 'none')),
  interview_credits_per_period int not null default 0, -- -1 = unlimited
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_subscriptions: one active subscription per user.
-- mock_payment_reference is the placeholder for a future stripe_subscription_id.
-- ---------------------------------------------------------------------------
create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  mock_payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- usage_credits: consumption within the current billing period.
-- ---------------------------------------------------------------------------
create table public.usage_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  period_start timestamptz not null default now(),
  period_end timestamptz,
  interviews_used int not null default 0,
  interviews_limit int not null default 0, -- -1 = unlimited
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);
create index usage_credits_user_id_idx on public.usage_credits (user_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger resumes_set_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();
create trigger cover_letters_set_updated_at before update on public.cover_letters
  for each row execute function public.set_updated_at();
create trigger interview_sessions_set_updated_at before update on public.interview_sessions
  for each row execute function public.set_updated_at();
create trigger user_subscriptions_set_updated_at before update on public.user_subscriptions
  for each row execute function public.set_updated_at();
create trigger usage_credits_set_updated_at before update on public.usage_credits
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row (and a free subscription + usage row) when a new
-- auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_plan_id uuid;
  free_limit int;
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));

  select id, interview_credits_per_period
    into free_plan_id, free_limit
  from public.subscription_plans
  where slug = 'free'
  limit 1;

  if free_plan_id is not null then
    insert into public.user_subscriptions (user_id, plan_id, current_period_start, current_period_end)
    values (new.id, free_plan_id, now(), now() + interval '1 month');

    insert into public.usage_credits (user_id, period_start, period_end, interviews_used, interviews_limit)
    values (new.id, now(), now() + interval '1 month', 0, coalesce(free_limit, 3));
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

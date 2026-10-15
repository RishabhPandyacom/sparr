-- ============================================================================
-- Sparr core: career plans (the Resume -> Salary -> Summary journey), the job
-- application tracker, and privacy-consent capture on profiles.
-- Idempotent by design (if not exists / drop policy if exists).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles: record that the user accepted the privacy notice, and which
-- version they accepted. Written by the signup trigger from auth metadata.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists privacy_consent_at timestamptz,
  add column if not exists privacy_consent_version text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_plan_id uuid;
  free_limit int;
  consent_version text;
begin
  consent_version := nullif(new.raw_user_meta_data ->> 'privacy_consent_version', '');

  insert into public.profiles (id, full_name, privacy_consent_at, privacy_consent_version)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when consent_version is not null then now() else null end,
    consent_version
  );

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

-- ---------------------------------------------------------------------------
-- career_plans: one row per run of the guided journey.
--   resume_data  step 1 inputs (target role, skills, experience, ...)
--   salary_data  step 2 inputs (offer, target, location, style, ...)
--   plan         the generated action plan (written by the Python backend)
-- ---------------------------------------------------------------------------
create table if not exists public.career_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'My career plan',
  status text not null default 'draft' check (status in ('draft', 'complete')),
  current_step int not null default 1 check (current_step between 1 and 3),
  resume_data jsonb not null default '{}'::jsonb,
  salary_data jsonb not null default '{}'::jsonb,
  plan jsonb,
  readiness_score int check (readiness_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists career_plans_user_id_idx
  on public.career_plans (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- applications: the job-application tracker (Kanban by status).
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'wishlist'
    check (status in ('wishlist', 'applied', 'interviewing', 'offer', 'rejected')),
  job_url text,
  location text,
  notes text,
  applied_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_id_idx
  on public.applications (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists career_plans_touch on public.career_plans;
create trigger career_plans_touch before update on public.career_plans
  for each row execute function public.touch_updated_at();

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: owners only, for every operation.
-- ---------------------------------------------------------------------------
alter table public.career_plans enable row level security;
alter table public.applications enable row level security;

drop policy if exists "career_plans_owner_all" on public.career_plans;
create policy "career_plans_owner_all" on public.career_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "applications_owner_all" on public.applications;
create policy "applications_owner_all" on public.applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Table privileges for the API roles (RLS above still limits rows).
grant all on public.career_plans to authenticated, service_role;
grant all on public.applications to authenticated, service_role;

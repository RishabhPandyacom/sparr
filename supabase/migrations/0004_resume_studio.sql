-- ============================================================================
-- Resume Studio
--
-- Adds everything the document builder needs beyond "a blob of jsonb":
--   * résumé vs CV as a first-class distinction
--   * the template slug on the row (the catalogue itself lives in TypeScript,
--     so the two can never drift out of sync)
--   * version snapshots, so autosave is never destructive
--   * public share links, readable without an account
--   * a reusable bullet library
-- ============================================================================

-- ---------------------------------------------------------------------------
-- resumes: document type, template, sharing, cached score
-- ---------------------------------------------------------------------------
alter table public.resumes
  add column if not exists doc_type text not null default 'resume',
  add column if not exists template_slug text not null default 'classic',
  add column if not exists target_role text,
  add column if not exists share_slug text,
  add column if not exists is_public boolean not null default false,
  add column if not exists last_score int;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resumes_doc_type_check'
  ) then
    alter table public.resumes
      add constraint resumes_doc_type_check check (doc_type in ('resume', 'cv'));
  end if;
end $$;

create unique index if not exists resumes_share_slug_key
  on public.resumes (share_slug) where share_slug is not null;

-- ---------------------------------------------------------------------------
-- resume_versions: point-in-time snapshots.
-- Written on meaningful edits (not every keystroke) and pruned to the most
-- recent 30 per document by the trigger below.
-- ---------------------------------------------------------------------------
create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content jsonb not null,
  title text not null default 'Untitled',
  /** Why the snapshot exists: 'manual' | 'autosave' | 'ai' | 'import' | 'template' */
  reason text not null default 'autosave',
  label text,
  score int,
  created_at timestamptz not null default now()
);
create index if not exists resume_versions_resume_id_idx
  on public.resume_versions (resume_id, created_at desc);

create or replace function public.prune_resume_versions()
returns trigger
language plpgsql
as $$
begin
  delete from public.resume_versions
  where resume_id = new.resume_id
    and id not in (
      select id from public.resume_versions
      where resume_id = new.resume_id
      order by created_at desc
      limit 30
    );
  return null;
end;
$$;

drop trigger if exists resume_versions_prune on public.resume_versions;
create trigger resume_versions_prune
  after insert on public.resume_versions
  for each row execute function public.prune_resume_versions();

-- ---------------------------------------------------------------------------
-- bullet_library: reusable accomplishment bullets, saved once and dropped into
-- any document. The thing people actually rewrite from scratch every time.
-- ---------------------------------------------------------------------------
create table if not exists public.bullet_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  tags jsonb not null default '[]'::jsonb,
  source_role text,
  times_used int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists bullet_library_user_id_idx on public.bullet_library (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.resume_versions enable row level security;
alter table public.bullet_library  enable row level security;

drop policy if exists "resume_versions_select_own" on public.resume_versions;
create policy "resume_versions_select_own" on public.resume_versions
  for select using (auth.uid() = user_id);
drop policy if exists "resume_versions_insert_own" on public.resume_versions;
create policy "resume_versions_insert_own" on public.resume_versions
  for insert with check (auth.uid() = user_id);
drop policy if exists "resume_versions_delete_own" on public.resume_versions;
create policy "resume_versions_delete_own" on public.resume_versions
  for delete using (auth.uid() = user_id);

drop policy if exists "bullet_library_select_own" on public.bullet_library;
create policy "bullet_library_select_own" on public.bullet_library
  for select using (auth.uid() = user_id);
drop policy if exists "bullet_library_insert_own" on public.bullet_library;
create policy "bullet_library_insert_own" on public.bullet_library
  for insert with check (auth.uid() = user_id);
drop policy if exists "bullet_library_update_own" on public.bullet_library;
create policy "bullet_library_update_own" on public.bullet_library
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "bullet_library_delete_own" on public.bullet_library;
create policy "bullet_library_delete_own" on public.bullet_library
  for delete using (auth.uid() = user_id);

-- Public share links: anonymous readers may see a résumé ONLY when its owner
-- has explicitly published it. Every other row stays owner-scoped.
drop policy if exists "resumes_select_shared" on public.resumes;
create policy "resumes_select_shared" on public.resumes
  for select using (is_public = true and share_slug is not null);

-- ---------------------------------------------------------------------------
-- resume_templates: keep the catalogue table in step with the design system in
-- src/lib/resume/design.ts. The app reads the TypeScript catalogue (so the two
-- can't drift at runtime); this mirror exists for SQL-side reporting.
-- ---------------------------------------------------------------------------
alter table public.resume_templates
  add column if not exists family text not null default 'resume',
  add column if not exists ats_safe boolean not null default true,
  add column if not exists sort_order int not null default 0;

insert into public.resume_templates (slug, name, description, layout_key, family, ats_safe, sort_order, is_active)
values
  ('classic',   'Classic',     'Timeless centred serif header with ruled sections.',        'single',        'resume', true,   0, true),
  ('modern',    'Modern',      'Indigo sidebar for contact and skills.',                     'sidebar-left',  'resume', false,  1, true),
  ('minimal',   'Minimal',     'Nothing but type and air.',                                  'single',        'resume', true,   2, true),
  ('creative',  'Creative',    'Full-bleed gradient banner with a rose accent.',             'banner',        'resume', false,  3, true),
  ('technical', 'Technical',   'Monospaced, dense, hash-marked sections.',                   'single',        'resume', true,   4, true),
  ('executive', 'Executive',   'Split header, heavy rule, navy authority.',                  'single',        'resume', true,   5, true),
  ('atlas',     'Atlas',       'Soft tinted rail instead of a colour block.',                'sidebar-left',  'resume', false,  6, true),
  ('meridian',  'Meridian',    'Right-hand teal rail preserves reading order.',              'sidebar-right', 'resume', false,  7, true),
  ('compact',   'Compact',     'Two body columns and tight leading.',                        'two-col-body',  'resume', false,  8, true),
  ('timeline',  'Timeline',    'Dated rail with connector dots.',                            'timeline',      'resume', false,  9, true),
  ('onyx',      'Onyx',        'Black band, white type, surgical spacing.',                  'banner',        'resume', false, 10, true),
  ('aurora',    'Aurora',      'Violet-to-sky gradient header with chip skills.',            'banner',        'resume', false, 11, true),
  ('nordic',    'Nordic',      'Humanist type, hairline rules, cool grey-blue.',             'single',        'resume', true,  12, true),
  ('ledger',    'Ledger',      'Slab serif with boxed section chips.',                       'single',        'resume', true,  13, true),
  ('cascade',   'Cascade',     'Full-width header over two balanced body columns.',          'two-col-body',  'resume', false, 14, true),
  ('monogram',  'Monogram',    'Initials tile anchors the page.',                            'single',        'resume', false, 15, true),
  ('helio',     'Helio',       'Condensed type and a sunset band.',                          'banner',        'resume', false, 16, true),
  ('slate',     'Slate',       'Deep slate rail with monospaced headings.',                  'sidebar-left',  'resume', false, 17, true),
  ('bold',      'Bold',        'Oversized name, filled section chips.',                      'single',        'resume', true,  18, true),
  ('editorial', 'Editorial',   'Magazine masthead, hairline rules, wide gutters.',           'editorial',     'resume', false, 19, true),
  ('quartz',    'Quartz',      'Pale right rail with a rose accent.',                        'sidebar-right', 'resume', false, 20, true),
  ('graphite',  'Graphite',    'Tight grotesk single column.',                               'single',        'resume', true,  21, true),
  ('horizon',   'Horizon',     'Photo-ready banner in sky blue.',                            'banner',        'resume', false, 22, true),
  ('verve',     'Verve',       'Purple timeline with dotted headings.',                      'timeline',      'resume', false, 23, true),
  ('paper',     'Paper',       'Zero colour, pure black on warm white.',                     'single',        'resume', true,  24, true),
  ('terminal',  'Terminal',    'Bracketed sections, monospace everything.',                  'single',        'resume', true,  25, true),
  ('academic',  'Academic',    'The standard multi-page academic CV.',                       'academic',      'cv',     true,  30, true),
  ('scholar',   'Scholar',     'Restrained serif CV with wide margins.',                     'academic',      'cv',     true,  31, true),
  ('oxford',    'Oxford',      'Centred masthead in didone small caps.',                     'academic',      'cv',     true,  32, true),
  ('lab',       'Lab',         'Sans-serif research CV with teal side rules.',               'academic',      'cv',     true,  33, true),
  ('clinical',  'Clinical',    'Navy boxed headings for long credential lists.',             'academic',      'cv',     true,  34, true),
  ('fellow',    'Fellow',      'Split header with hairline rules between entries.',          'academic',      'cv',     true,  35, true),
  ('curator',   'Curator',     'Editorial CV for arts and culture.',                         'editorial',     'cv',     false, 36, true),
  ('praxis',    'Praxis',      'Slab-serif CV with amber section chips.',                    'academic',      'cv',     true,  37, true),
  ('archive',   'Archive',     'Monospaced metadata against serif body.',                    'academic',      'cv',     true,  38, true),
  ('tenure',    'Tenure',      'Numbered sections and compact leading.',                     'academic',      'cv',     true,  39, true),
  ('atrium',    'Atrium',      'Industry CV with a tinted rail.',                            'sidebar-left',  'cv',     false, 40, true),
  ('europass',  'Continental', 'A4, structured, photo-ready.',                               'single',        'cv',     true,  41, true)
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      layout_key  = excluded.layout_key,
      family      = excluded.family,
      ats_safe    = excluded.ats_safe,
      sort_order  = excluded.sort_order,
      is_active   = excluded.is_active;

-- Grants for the new tables (mirrors 0003).
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

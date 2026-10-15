# Sparr

A career suite for students and early-career job seekers. Build a **career plan**
(résumé readiness score → salary range → negotiation script → action plan), track
**applications** through a pipeline, and use the résumé studio, cover letters and
mock interviews around it. Built for BUS4012 (Assignment 3).

Every score, estimate and script is produced by transparent **rule-based
engines**, not a language model. Each result shows its working, and anything the
product cannot know (your results, your numbers) is left as a visible prompt for
you to fill in.

## Architecture

```
React (Next.js 16, Vercel) ──Bearer JWT──▶ FastAPI (Python, Vercel) ──JWT + anon key──▶ Supabase
        │                                        │                                       Postgres + RLS
        └────── Supabase Auth (sign up / in) ────┘
```

- **Frontend** `src/` — Next.js App Router, React 19, Tailwind v4, shadcn on Base UI.
  Signs users in with Supabase Auth, then calls the Python API with the session token.
- **Backend** `backend/` — FastAPI. Verifies the token with Supabase, runs the engines
  and reads/writes the database **as the user** (their JWT + the public anon key), so
  Postgres row-level security enforces ownership even if application code had a bug.
  The service-role key is used for exactly one thing: deleting an account on request.
- **Database** `supabase/migrations/` — Postgres schema with RLS policies on every table.
  `career_plans` and `applications` are owner-only (`auth.uid() = user_id`).

### Credential management

| Secret | Where it lives | Exposed to browser? |
|---|---|---|
| Supabase anon key / URL | Vercel env (frontend + backend) | Yes by design (RLS-protected) |
| Supabase service-role key | Vercel env of the **backend** (and server-only frontend var) | **Never** |
| Database password | Not in the app at all; used only to apply migrations from a dev machine | No |

`.env*` files are git-ignored; `.env.example` and `backend/.env.example` list every variable.

## Run locally

Requires Node 20+, Python 3.11+, and a Supabase project (hosted or `npx supabase start`).

```bash
# 1. Frontend
cp .env.example .env.local      # fill in your Supabase URL + anon key
npm install
npm run dev                     # http://localhost:3000

# 2. Backend (second terminal)
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # same Supabase values (+ service-role key)
uvicorn app.main:app --reload   # http://localhost:8000/docs
pytest                          # 23 tests: engines, API, data isolation
```

Apply the schema once: `python scripts/db_apply.py` (reads `SUPABASE_DB_HOST`,
`SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` from the environment) or paste
`supabase/migrations/*.sql` then `supabase/seed.sql` into the Supabase SQL editor.

## Deploy (Vercel)

Two Vercel projects from this one repo:

| Project | Root directory | Environment variables |
|---|---|---|
| `sparr` (frontend) | `/` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (the backend URL), `SUPABASE_SERVICE_ROLE_KEY` (optional, waitlist) |
| `sparr-api` (backend) | `backend` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS` (the frontend URL) |

Then in Supabase → Authentication → URL Configuration set the Site URL and a
redirect URL (`<frontend>/auth/callback`) to the deployed frontend.

## Privacy and data rights

Consent to the privacy notice is required at signup and stored with a version
(`profiles.privacy_consent_*`). Settings → Privacy & data lets a user download
everything held about them as JSON (`GET /api/me/export`) or permanently delete
the account (`DELETE /api/me`), modelled on Australian Privacy Principles 11–13.

## Project layout

```
src/app/(auth)/ (dashboard)/   screens
src/components/plan/           career plan wizard (form kit, stepper, summary)
src/lib/api/                   typed client for the Python API
backend/app/engines/           readiness, salary, script, plan (pure, tested)
backend/app/routers/           career_plans, applications, tools, account
supabase/migrations/           schema + RLS
AGENTS.md                      engineering handbook for contributors
```

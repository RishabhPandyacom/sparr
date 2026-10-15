# Sparr

A career suite for students and early-career job seekers — résumé and CV
studio, cover letters, mock interviews, salary negotiation, and a job-board
waitlist.

Runs **entirely offline**: local Supabase for data and auth, mock providers for
AI, billing and email. No third-party API keys required, and no external calls
are made.

**Stack** — Next.js 16 (App Router) · Supabase (Postgres + Auth + RLS) ·
Tailwind CSS v4 · shadcn built on Base UI · TypeScript.

---

## Getting started

Requires Node 20+ and Docker Desktop.

```bash
open -a Docker          # or start Docker Desktop by hand
npm install             # only if node_modules is missing
npx supabase start      # first run pulls images; a few minutes
npm run db:reset        # apply migrations + seed
npm run dev             # http://localhost:3000
```

Then sign up at `/signup`. Confirmation emails are captured locally by Mailpit at
http://127.0.0.1:54324 — nothing is sent to a real inbox.

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (emails) | http://127.0.0.1:54324 |
| Supabase API | http://127.0.0.1:54321 |

`.env.local` ships with the standard local Supabase demo keys. They are
development-only and safe on your machine; see `.env.example` for what each
variable does.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (also a full type-check) |
| `npm run lint` | ESLint |
| `npm run db:start` / `db:stop` | Supabase stack up / down |
| `npm run db:reset` | Re-run migrations + seed — **wipes local data** |
| `npm run db:types` | Regenerate Supabase TypeScript types after a schema change |

---

## What's in it

**Résumé & CV studio** — 26 résumé styles and 12 academic CV styles. Type a
target role and get a complete first draft: summary, dated roles with quantified
bullet patterns, role-appropriate skills, and the sections that role expects
(publications for researchers, certifications for clinicians, a portfolio for
designers). Then edit everything directly on the page.

- Live résumé score with a traceable rubric — every point maps to a named check
- Job-description keyword matching, with per-term add
- Rule-based bullet rewriting that shows its reasoning before you accept it
- Sections you can reorder, rename, hide, move between columns or invent
- Undo/redo, version snapshots, page-break guides, zoom
- Export to PDF, Word, ATS plain text, Markdown, HTML and JSON
- Public read-only share links
- Paste-to-import an existing résumé, and a reusable bullet library

**Cover letters** · generated against a job description and editable.
**Mock interviews** · chat, multiple-choice and coding rounds with feedback.
**Salary negotiator** · rule-based estimate plus a negotiation script.
**Notifications, pricing and billing** · scaffolded against mock providers.

---

## Working on it

`AGENTS.md` is the engineering handbook — architecture, conventions, constraints
and the gotchas that have caused real bugs. Read it before making changes; it's
also what Claude Code reads at the start of every session.

For design work, the entire visual system is `src/lib/resume/design.ts`. All 38
templates are configuration objects; restyling or adding one requires no
component code.

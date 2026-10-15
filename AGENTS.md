<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Sparr — agent handbook

A career suite for students and early-career job seekers. Next.js 16 (App
Router) frontend + Python FastAPI backend (`backend/`) + Supabase (Postgres, Auth,
RLS) + Tailwind v4 + shadcn-on-Base-UI.

Read this file before touching anything. It is the whole onboarding — everything
a new session needs is here or in the repo. Nothing lives outside this folder.

Live deprecation to be aware of: the `middleware.ts` convention is deprecated in
favour of `proxy`. `src/middleware.ts` still works and still refreshes the
Supabase session on every request; migrate deliberately, not incidentally.

---

## 1. Hard constraints

**No external API calls.** The AI providers in `src/lib/ai/providers/` —
`anthropic.ts` and `openai.ts` — are intentionally throwing stubs. The app runs
entirely on `MockAiProvider`. Do not implement them unless the user explicitly
asks. This has been reverted once already.

The consequence for feature design: build AI-adjacent features so they work
**fully offline first**, as deterministic rule-based engines sitting behind the
same interface a model would use. The résumé generator, bullet rewriter, keyword
matcher and scorer are all built this way — dropping a real provider in later
changes one file and nothing else.

**Small, verified steps.** Work in tight increments and commit each one. Sessions
get interrupted; a half-finished sweep across thirty files is unrecoverable.

---

## 2. Running it

```bash
open -a Docker            # wait until `docker info` succeeds
npx supabase start        # API :54321 · Studio :54323 · Mailpit :54324
npm run db:reset          # applies migrations + seed. WIPES DATA.
npm run dev               # http://localhost:3000
```

`.env.local` is already present and gitignored. It holds the standard local
Supabase demo keys — dev-only, safe locally, never production. `.env.example`
documents every variable.

| Script | Does |
|---|---|
| `npm run db:start` / `db:stop` | Supabase stack up/down |
| `npm run db:reset` | Re-run all migrations + seed (destructive) |
| `npm run db:types` | Regenerate `src/lib/supabase/database.types.ts` — **run after every schema change** |
| `npm run build` | Full production build |

DB container: `supabase_db_Job_seeker_ai_startup`. Query it directly with:

```bash
docker exec supabase_db_Job_seeker_ai_startup psql -U postgres -d postgres -c "…"
```

### Verifying without Docker

If Supabase or Docker won't start, do **not** sit in a polling loop waiting.
Verify statically instead, and say plainly what's left unverified:

```bash
npx tsc --noEmit
npx eslint src
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" npx next build
```

---

## 3. Gotchas that have bitten before

- **RLS alone is not enough.** API roles also need table `GRANT`s (migration
  `0003_grants.sql`). Without them, authenticated reads silently return `null`
  and the UI quietly falls back to defaults. If data "isn't loading" and there's
  no error, check grants before anything else.
- **`(dashboard)` is a route group and contributes no URL segment.** Dashboard
  pages must live under the literal `dashboard/` folder inside it — i.e.
  `src/app/(dashboard)/dashboard/<feature>/page.tsx`. A page placed directly in
  `(dashboard)/` resolves to `/<feature>`, not `/dashboard/<feature>`.
- **Never run `npm run build` while `next dev` is running.** They share `.next`;
  the build clobbers it and the dev server starts returning 404s. Kill the dev
  server first.
- **Flex items need `min-w-0` to shrink below their content.** The résumé studio
  is a fixed-width page between two rails; without `min-w-0` on the dashboard's
  main column it pushed the layout past the viewport and hid the right rail
  instead of scrolling the canvas.
- **A hydration mismatch usually means an id.** Anything that builds a document
  *during render* calls `newId()`, which is random, so the server and client
  disagree on `data-section-id`. Preview components therefore render
  client-only (see `src/components/resume/preview.tsx` — the reasoning, and why
  the obvious `useSyncExternalStore` fix does not work, is documented there).
- **shadcn here is built on Base UI, not Radix.** There is no `asChild` on most
  primitives — use `render={<a />}` / `render={<button />}`, plus `nativeButton`
  where a menu item must be a real button. `Button` has an `asChild` shim.
  `src/components/layout/user-menu.tsx` is the reference implementation.
- **Regenerate `database.types.ts` after schema changes**, or hand-edit it to
  match. Stale types compile fine and fail at runtime.
- **Turbopack caches hard.** If console errors look stale, kill the dev server,
  delete `.next`, restart.
- **Migrations are idempotent by design** (`if not exists`, `drop policy if
  exists`). The `NOTICE … does not exist, skipping` lines on a fresh reset are
  expected, not failures.

---

## 4. Layout of the codebase

```
src/app/(auth)/          login, signup, forgot-password
src/app/(dashboard)/     the authenticated app
src/app/r/[slug]/        PUBLIC read-only shared résumé (no auth)
src/lib/<feature>/       actions.ts (server actions) + pure domain logic
src/components/ui/       shadcn-on-Base-UI primitives
supabase/migrations/     0001 schema · 0002 RLS · 0003 grants · 0004 résumé studio
```

Every feature follows the same shape: pure logic in `src/lib/<feature>/`, server
actions in that folder's `actions.ts`, UI in `src/components/<feature>/`.

Providers are swappable behind interfaces — `src/lib/ai`, `src/lib/billing`,
`src/lib/notifications` each pick an implementation from an env var and default
to a mock. Never import a vendor SDK outside a provider file.

---

## 5. The résumé / CV studio

The largest subsystem. Worth understanding before editing anything under
`src/lib/resume/` or `src/components/resume/`.

### Content model (v2)

A document is `basics` + an **ordered list of sections**. Each section is one of
four kinds — `text`, `entries`, `tags`, `groups` — so a template renders *kinds*
and never needs to know "publications" from "experience". This is why sections
can be reordered, renamed, hidden, moved between columns and invented by the
user at no cost.

`normalizeContent()` in `src/lib/resume/schema.ts` accepts anything ever stored
in `resumes.content` — v2, v1, or junk — and always returns a valid v2 document.
**Never bypass it when reading from the database.**

### Templates are data, not components

`src/lib/resume/design.ts` is the single source of truth: 26 résumé + 12 CV
styles, each a `ResumeTheme` (layout, colour, type, density, page geometry). The
token vocabulary is 8 layouts × 8 header styles × 10 heading styles × 8
typefaces, plus density, margins, bullet glyphs and page size.

Adding a style = adding one config object. There is no component to write. This
is also the file to hand a designer.

The `resume_templates` table mirrors this catalogue for SQL-side reporting only
— **the app reads the TypeScript**, so the two cannot drift at runtime. If you
add a template, add the matching row in a new migration.

### Two renderers, one set of tokens

- `src/components/resume/doc/` — the HTML renderer (also the live editor)
- `src/components/resume/pdf/` — the @react-pdf renderer

Both consume the same **point-based** type scale. Because the on-screen page is
sized in inches and 1pt = 1/72in, a `10pt` heading is physically identical on
screen and in the export. That is what makes the preview genuinely WYSIWYG.
Change one renderer, change the other.

@react-pdf ships only Helvetica / Times / Courier, so `pdfFontFamily()` folds the
eight design fonts onto those three. That keeps exports fully offline with no
missing-glyph boxes.

### The offline intelligence

| File | Does |
|---|---|
| `roleLibrary.ts` | 24 role families: skills, summaries, accomplishment patterns |
| `generate.ts` | Role → complete draft. Pure and **deterministic** (seeded RNG) |
| `analysis.ts` | The résumé score. Every point traces to a named check |
| `keywords.ts` | JD keyword extraction + weighted matching |
| `rewrite.ts` | Rule-based bullet rewriting |
| `parse.ts` | Paste-an-existing-résumé importer |
| `export.tsx` | PDF / Word / ATS text / Markdown / HTML / JSON |

**Never invent facts on the user's behalf.** Where a number or date is missing,
these emit a visible `[…]` prompt for the user to fill in. A résumé with a
fabricated statistic is worse than one without — this is a product rule, not a
style preference.

### Sharing

`/r/[slug]` is public. Visibility is enforced by the `resumes_select_shared` RLS
policy (`is_public = true and share_slug is not null`), **not** by a check in the
page. Keep it that way — an unpublished document then cannot leak even if the
page is wrong.

---

## 6. Sparr additions (Assignment 3)

- **Python API** in `backend/` (FastAPI). The frontend calls it through
  `src/lib/api/client.ts` (browser) and `server.ts` (server components) with the
  Supabase session token as a Bearer header. The API forwards that token to
  PostgREST so RLS applies; the service-role key is used only in `routers/account.py`.
- **Career plan** (`/dashboard/career-plan`): résumé → salary → summary, stored in
  `career_plans` (migration `0005_sparr_core.sql`). Engines in `backend/app/engines/`
  are pure functions with tests (`cd backend && pytest`).
- **Applications** (`/dashboard/applications`): pipeline board over the `applications` table.
- **Privacy**: consent captured at signup, export/delete in Settings. Keep copy honest:
  the tools are rule-based, never call them "AI".
- After editing role data in `src/lib/resume/roleLibrary.ts`, regenerate
  `backend/app/data/roles.json` with `npx tsx scripts/export-roles.ts`.

---

## 7. Current state

Feature-complete MVP. Auth, résumé/CV studio, cover letters, mock interviews
(chat / MCQ / coding), job-board waitlist, salary negotiator, notifications,
pricing and billing scaffolding, settings.

Everything runs offline against local Supabase and the mock providers. There are
no live third-party integrations, by design.

Worth knowing about the data model: the `handle_new_user` trigger fires on
signup and auto-creates the profile, a free subscription and a `usage_credits`
row. The free plan allows 3 mock interviews per month, and that gating is live —
interview creation checks it.

The coding interview round uses Monaco. Interview screens (and only those) are
wrapped in `AntiCheatBoundary`, which disables paste and right-click.

Plausible next steps, if asked: real LLM wiring (see the constraint in §1 first),
Stripe in `src/lib/billing/providers/stripe.ts`, more coding languages,
scheduled reminder delivery via a real email provider, deployment.

### Known housekeeping

`nvidiakeys.env` holds an unused `NVIDIA_API_KEY`. It is now gitignored and
untracked, but it **remains in git history** (commit `7c26c93`). Rotate that key
before sharing or publishing this repository.

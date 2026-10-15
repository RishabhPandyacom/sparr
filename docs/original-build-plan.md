# AI Co-pilot for Students — SaaS Web App

## Context

The user wants to build a full SaaS product for students navigating the job search: AI mock interviews, an AI resume builder, an AI cover letter generator, a job board (waitlist-only for now), a salary negotiation calculator, notifications/reminders, and usage-based pricing — all as one working web app, not a mockup. The working directory is completely empty, so this is a from-scratch build. The explicit priority is a product that is genuinely functional end-to-end (real auth, real data persistence, real AI calls once a key is supplied, real PDF exports), scoped sensibly where full "real" integrations aren't feasible yet (payments, code execution, email delivery) by building clean swap-in points instead of fake UI dead ends.

Confirmed decisions from the user:
- **Stack:** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Storage), Tailwind + shadcn/ui.
- **Supabase environment:** run locally via Supabase CLI + Docker (already installed on this machine) — no cloud account needed yet; env vars make switching to a hosted project later a config change, not a rebuild.
- **Deployment:** local only for now (`npm run dev`); Vercel deployment deferred.
- **LLM provider:** undecided — build a provider-agnostic AI abstraction (Anthropic/OpenAI/mock, switched by env var) so the app is fully demoable today against a mock provider and a real key can be dropped in later with zero code changes.
- **Payments:** no real Stripe integration yet — build the full pricing/usage-credit data model and UI against a mock billing provider (a "Simulate purchase" button, not fake card fields), architected so a real Stripe provider can be swapped in later behind the same interface.
- **Mock interviews:** three modes — text Q&A chat, MCQ rounds, and a coding round with an embedded Monaco code editor. Right-click and paste are disabled specifically on interview/coding screens (soft anti-cheat, not real DRM), while remaining fully enabled elsewhere (e.g. pasting a JD into the cover letter tool).

## Project Structure

Next.js App Router with route groups: `(auth)` for login/signup, `(dashboard)` for the protected app shell, plus public marketing/pricing/waitlist pages at the root.

```
app/
  page.tsx, pricing/page.tsx, waitlist/page.tsx        # public
  (auth)/login|signup|forgot-password/page.tsx
  (dashboard)/layout.tsx                                # auth guard + sidebar
  (dashboard)/dashboard/page.tsx
  (dashboard)/resumes/{page,new/page,[resumeId]/edit/page}.tsx
  (dashboard)/cover-letters/{page,new/page,[id]/edit/page}.tsx
  (dashboard)/interviews/{page,new/page}.tsx
  (dashboard)/interviews/[sessionId]/{chat,mcq,coding,results}/page.tsx
  (dashboard)/salary-negotiator/page.tsx
  (dashboard)/notifications/page.tsx
  (dashboard)/billing/{page,success/page}.tsx
  (dashboard)/job-board/page.tsx
  (dashboard)/settings/{page,account/page}.tsx
  api/ai/{cover-letter,interview/next-question,interview/feedback,interview/code-review,salary-negotiation}/route.ts
  api/billing/{checkout,webhook}/route.ts
  api/{resumes/pdf,notifications,waitlist}/route.ts

components/
  ui/                        # shadcn primitives
  layout/                    # Sidebar, TopNav, NotificationBell
  resume/templates/          # 5 on-screen template components + matching components/resume/templates/pdf/*
  resume/{ResumeEditorCanvas,ResumePdfExportButton}.tsx
  cover-letter/{CoverLetterEditor,CoverLetterExportButton}.tsx
  interview/{AntiCheatBoundary,ChatInterviewRoom,McqRound,CodingRound,CodeEditor,InterviewTimer,ResultsSummary}.tsx
  salary/SalaryCalculatorForm.tsx
  notifications/NotificationList.tsx
  billing/{PricingTable,DummyCheckoutModal,UsageMeter}.tsx

lib/
  supabase/{client,server,middleware,admin}.ts
  ai/{types,index}.ts, ai/providers/{anthropic,openai,mock}.ts, ai/prompts/*.ts
  billing/{types,index}.ts, billing/providers/{mock,stripe(stub)}.ts
  notifications/{types}.ts, notifications/providers/{inApp,email(stub)}.ts
  pdf/generateResumePdf.ts
  interview/{stateMachine,scoring,questionBank}.ts
  validation/*.ts (zod schemas)
  auth/guards.ts

supabase/migrations/*.sql, supabase/seed.sql
types/database.types.ts        # generated via `supabase gen types typescript`
middleware.ts
```

## Data Model (Supabase/Postgres)

All user-owned tables use `uuid` PKs, RLS scoped to `auth.uid() = user_id`. Public-read catalogs (`resume_templates`, `subscription_plans`) have no client insert/update. `waitlist_signups` allows public insert only.

- **`profiles`** — 1:1 with `auth.users`; `full_name`, `avatar_url`, `headline`, `target_role`, `resume_context` (jsonb snapshot for AI context, explicitly re-synced from a resume, not auto-live).
- **`resume_templates`** — seeded catalog: `slug`, `name`, `preview_image_url`, `layout_key` (maps to a React component).
- **`resumes`** — `user_id`, `template_id`, `title`, `content` (jsonb: structured name/contact/sections — one canonical data shape every template renders), `is_primary`.
- **`cover_letters`** — `user_id`, `resume_id?`, `job_description`, `company_name?`, `generated_content`, `edited_content?`, `ai_provider`, `ai_model`.
- **`interview_sessions`** — `user_id`, `mode` (chat/mcq/coding), `status` (not_started/in_progress/completed/abandoned), `topic?`, `difficulty?`, timestamps, `total_score`, `max_score`, `summary_feedback`, `credits_consumed`.
- **`interview_questions`** — `session_id`, `sequence_number`, `question_type`, `prompt`, `options` (jsonb, MCQ), `correct_option_key?`, `starter_code?`, `language?`.
- **`interview_answers`** — `question_id`, `session_id`, `answer_text?`, `selected_option_key?`, `is_correct?`, `ai_feedback?`, `score?`.
- **`coding_submissions`** — `question_id`, `session_id`, `code`, `language`, `ai_review?`, `ai_score?`, `ai_strengths` (jsonb), `ai_issues` (jsonb). No real code execution — grading is AI-review-only (see Risks).
- **`waitlist_signups`** — `name`, `email` (unique), `linkedin_url?`, `user_id?`, `source` default `job_board`.
- **`notifications`** — `user_id`, `type`, `title`, `body`, `link?`, `is_read`, `scheduled_for?`, `delivered_at?`, `channel` default `in_app`.
- **`subscription_plans`** — seeded: `slug` (free/pro/premium), `price_cents`, `billing_interval`, `interview_credits_per_period` (`-1` = unlimited), `features` (jsonb).
- **`user_subscriptions`** — `user_id` (unique), `plan_id`, `status`, `current_period_start/end`, `mock_payment_reference?` (placeholder for future `stripe_subscription_id`).
- **`usage_credits`** — `user_id`, `period_start/end`, `interviews_used`, `interviews_limit`. Server-side gate: before creating an `interview_sessions` row, check quota; block with upgrade prompt if exceeded.

## Swappable Abstractions (the key architectural move)

**AI (`lib/ai/`)** — `AiProvider` interface (`generateText`, `generateStructured<T>`) implemented by `anthropic.ts`, `openai.ts`, and `mock.ts` (canned responses, default via `AI_PROVIDER=mock`). `getAiProvider()` factory reads the env var. Every feature (cover letter, interview Q&A/feedback/code-review, salary talking points) calls the factory — never imports an SDK directly — so the whole app is usable and demoable today with no API key, and a real key later is a one-line env change.

**Billing (`lib/billing/`)** — `BillingProvider` interface (`createCheckoutSession`, `getSubscriptionStatus`, `cancelSubscription`, `handleWebhookEvent`). `mock.ts` (active now): "Simulate purchase" button writes `user_subscriptions` + resets `usage_credits` directly, no fake card fields (avoids any appearance of collecting real payment data). `stripe.ts` is a stubbed-but-not-implemented file for later — same interface, so swapping is implementing that one file + an env var, no UI/schema changes.

**Notifications (`lib/notifications/`)** — `inApp.ts` (active: writes to `notifications` table) and `email.ts` (stub, no-ops/throws until a real provider key like Resend exists).

## Library Choices

- **PDF export:** `@react-pdf/renderer` — resumes need pixel-accurate, selectable-text, professionally laid-out PDFs; DOM-rasterizing approaches (html2canvas+jsPDF) produce blurry non-selectable output and fight page-break logic. Each template gets a matching on-screen React component and a `@react-pdf/renderer` document component, both driven by the same `resumes.content` jsonb.
- **Code editor:** Monaco (`@monaco-editor/react`) for a real IDE feel; lazy-loaded only on the coding-round route.
- **Inline resume editing:** real form inputs (not raw `contentEditable`) styled invisibly into the template layout, via `react-hook-form` + `zod`, so data stays clean structured state instead of parsed-back HTML.
- **Styling:** Tailwind + shadcn/ui for app chrome.
- **State:** mostly server state via Supabase + RSC; `@tanstack/react-query` only where needed (interview session runner, notification bell); no global store.

## Anti-Cheat (right-click + paste disabled)

Component-level only, via `components/interview/AntiCheatBoundary.tsx` wrapping just the three interview-round pages (`chat`, `mcq`, `coding`) — never global, so pasting a JD into the cover-letter tool keeps working. Blocks `contextmenu`/`paste` at the container, plus disabling Monaco's own built-in context menu/paste commands on the coding round specifically. This is a soft deterrent, not real DRM — worth being upfront about that with the user in the product itself if relevant (e.g. no promise of "cheat-proof").

## Build Order

0. **Scaffold & infra** — `create-next-app`, Tailwind/shadcn, `supabase init` + local CLI/Docker stack, all migrations + RLS + seed data (templates, plans), `lib/supabase/*`, `.env.example` (`AI_PROVIDER=mock`, `BILLING_PROVIDER=mock`). Milestone: app runs locally against local Supabase.
1. **Auth & dashboard shell** — email/password auth, `profiles` auto-create trigger, protected layout + sidebar (stub links). Google OAuth deferred as stretch.
2. **AI abstraction + mock provider** — built before any feature depends on it, so everything downstream is demoable without a key.
3. **Resume builder** — validate the pattern (editor canvas + PDF renderer) with 2 templates first, then scale to the full 5.
4. **Cover letter generator** — paste-JD form → AI generation → edit → export.
5. **Mock interviews** (largest phase, sub-phased): schema + state machine → chat mode → MCQ mode → coding mode (Monaco + anti-cheat + AI review) → results summary.
6. **Smaller standalone features** — job board waitlist form, salary negotiator (calculator + AI talking points), notification center (manually/event-triggered rows; no real scheduler yet).
7. **Pricing/billing UI** — pricing page, mock checkout, usage-credit gating wired into interview creation.
8. **Polish** — empty/loading/error states, responsive pass, remaining templates if not finished, landing page.

A real `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` and a real Stripe key can be dropped in at any point after phases 2 and 7 respectively with no restructuring.

## Known Scope Limits (flagged upfront, not oversights)

- **No real code execution/sandbox** for the coding interview round — grading is AI-review-only (qualitative feedback + score), not test-case pass/fail. Real execution (Judge0/Piston/containers) is a distinct, isolable future feature.
- **No real scheduled reminder delivery** — `notifications.scheduled_for` exists in the schema, but nothing proactively fires "1 hour before" reminders yet (needs a cron/Edge Function + real email provider). Notification center ships now backed by event-triggered rows (e.g. created when a session starts).
- **Anti-cheat is a soft deterrent**, bypassable via devtools/screenshots — appropriate for discouraging casual copy-pasting, not a security guarantee.
- **5 resume templates effectively means 10 layout implementations** (on-screen + PDF each) — phased as 2 first, then 3 more, rather than promised all-at-once in phase 3.
- **Docker must be running** for local Supabase (`supabase start`); Supabase CLI itself isn't installed yet and will be added as a dev dependency/via `npx` in Phase 0.

## Verification

- Phase 0: `npm run dev` serves the app; `supabase status` shows local Postgres/Auth/Storage running; `supabase gen types typescript` succeeds.
- Phase 1: sign up, log in, hit a protected route while logged out (redirects to `/login`), log out.
- Phase 3: create a resume from each available template, edit fields inline, download a PDF and confirm text is selectable and layout matches the on-screen preview.
- Phase 4: paste a sample JD, generate a cover letter (mock provider), edit it, export it.
- Phase 5: complete one full session in each of chat/MCQ/coding modes end-to-end, confirm right-click/paste are blocked on those screens but not elsewhere (e.g. cover-letter page), see a results/score summary.
- Phase 6: submit the waitlist form and confirm a row in `waitlist_signups`; run the salary calculator and get AI talking points; see a notification appear in the bell.
- Phase 7: exceed the free-tier interview quota, get blocked with an upgrade prompt, "simulate purchase," confirm quota resets and a new interview can start.

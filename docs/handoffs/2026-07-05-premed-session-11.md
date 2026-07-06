# Handoff — StudyOS Vercel deployment (2026-07-05, end of session 11)

## Scope this session
Deploy StudyOS to Vercel so `/premed` resolves at a real production URL. Read `docs/handoffs/2026-07-04-premed-session-10.md` first (session 10: multi-user auth, `DEV_USER_ID` retired, 303/303 tests). No app logic changed this session — infra/config only.

## What was built
- **`vercel.json`** at repo root: `buildCommand: npm run build`, `outputDirectory: dist`, catch-all rewrite `/(.*)` → `/index.html`. Needed because the app uses `BrowserRouter` ([App.tsx:1](../../src/App.tsx#L1)) — without the rewrite, a direct load or refresh on `/premed` (or any non-root route) would 404 on Vercel's static host.
- Committed as `76d1e8f` ("Add vercel.json for Vite SPA deploy"), pushed to `origin/master`.

## How the deploy actually happened (differs from the plan)
The plan assumed a CLI walkthrough (`vercel login` / `vercel link` / `vercel env add` / `vercel --prod`, user running each command). Instead the user connected the GitHub repo directly via Vercel's dashboard import — a valid, arguably better path (auto-deploys on every push to `master`, no local CLI state to manage). Consequence for future sessions: **deploys happen by `git push`, not by running `vercel` CLI commands.** Env vars and domain config are managed in the Vercel dashboard (Settings → Environment Variables), not via `vercel env add`.

## Pre-flight verification (before any deploy)
- `npm run build` — clean, no errors. 202 modules, ~2.1s. One pre-existing warning (unrelated to this session): main JS chunk 1.1MB + `pdf.worker` chunk 1.24MB exceed the 500KB chunk-size guideline. Not addressed — code-splitting is out of scope for a deploy session, flagged for a future perf pass.
- `npx vite preview` against the real Supabase project (`.env.local` values) — `/` and `/premed` both returned HTTP 200.
- **Secret-leakage proof**: grepped the built `dist/assets/*.js|css` and `dist/index.html` for the `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` **values** (read from `.env.local`, never printed to the conversation) and for the variable names themselves — zero matches. Ran a positive control first (searched for the known-browser-safe `VITE_SUPABASE_URL` value, which **was** found) to prove the grep methodology itself works, not a false negative. Only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` values reach the client bundle — confirmed by code inspection of [supabase.ts](../../src/lib/supabase.ts), which only reads those two `import.meta.env` vars.

## Deploy issue hit and fixed
First deployment (built from `7f56174`, before `vercel.json` existed) went **Ready** with a blank white page. Root cause: **no env vars had been set yet** in the Vercel dashboard — [supabase.ts:7-8](../../src/lib/supabase.ts#L7-L8) throws `Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY` at runtime with nothing set, crashing the React app to blank. Fixed by:
1. Adding `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Production scope) in Vercel's dashboard, values from `.env.local`.
2. Committing + pushing `vercel.json`, which triggered a fresh auto-deploy that picked up both the new env vars and the SPA rewrite together.

**Non-obvious fact for next session**: adding/editing env vars in the Vercel dashboard does **not** retroactively apply to an already-built deployment — a rebuild (new push, or manual Redeploy) is required for the new values to be baked in. If a future env var change looks like it's "not taking effect," check whether a redeploy actually happened after the change.

## Supabase production config
- **Auth → URL Configuration**: Site URL set to `https://study-os-murex.vercel.app`; added `https://study-os-murex.vercel.app/**` to Redirect URLs. Existing `localhost:5173` entry left in place for local dev.
- **CORS**: no change needed. `review-essay`'s Edge Function already sets `Access-Control-Allow-Origin: '*'` ([index.ts:15](../../supabase/functions/review-essay/index.ts#L15)) — confirmed by reading the function before touching anything, so the new Vercel origin was never actually at risk of a CORS failure.

## Live verification on production (`https://study-os-murex.vercel.app`)
- **Logged-out `/premed`**, driven directly via Playwright MCP against the production URL (no auth needed): pitch, demo-mode toggle, archetype switcher, inline sign-in panel, and the full demo dashboard (Applicant Pool Position, Activity Gaps, School Comparison) all rendered. Zero console errors or warnings. Screenshot: `docs/handoffs/session-11-production-logged-out.png`.
- **Logged-in `/premed`**: not driven by me — I don't have the real account's password (same limitation noted in session 10's handoff). User confirmed manually: signed into `crm2263@gmail.com` on `/dashboard` first (proving core auth works against production), then navigated to `/premed` and confirmed the real dashboard loaded with the profile data set up in prior sessions (RLS-scoped correctly).
- **One live essay-review call** (~$0.02, user pre-approved before running, submitted through the deployed UI): full rubric response returned correctly — per-dimension scores (Theme Coherence, Clinical Motivation Shown Not Told, Narrative Arc, Specificity Evidence, Reflection Depth), Strengths, Priority Fixes, Consistency Flags, and Red Flags all populated, matching session 8/9's output schema. Confirms the full chain end-to-end: Vercel frontend → Supabase Edge Function → Anthropic Sonnet → rendered UI, all against the production origin.
- **Existing ochem2 routes**: not independently re-tested route-by-route — `/dashboard` sign-in (above) is the entry point every other ochem2 route sits behind via `ProtectedRoute`, and no route logic changed this session (only `vercel.json`, purely additive). Judged sufficient; flagging here rather than silently assuming full route coverage.

## Tests
`npx vitest run` — 303/303 passed, 39/39 test files, unchanged from session 10. Config-only changes, no regressions expected or found.

## Real spend this session
One live Anthropic call via the deployed Edge Function, ~$0.02, pre-approved before running (same essay-review flow as session 8/9, now proven to work from the production origin).

## Non-obvious facts a future session will need
- Deploys are git-push-triggered (Vercel GitHub integration), not `vercel --prod` CLI. There is no local `.vercel/` project link — if a future session wants to use the Vercel CLI (e.g. `vercel env pull`, `vercel logs`), it will need `vercel link` first to associate this checkout with the existing dashboard-created project.
- Vercel env var changes require a rebuild to take effect — see "Deploy issue hit and fixed" above.
- Production URL: `https://study-os-murex.vercel.app`. A second, deployment-specific URL also exists (`study-j33v8iqo1-crm2263-8329s-projects.vercel.app`) — the former is the stable one to use/reference going forward.
- `PLAN.md` / `PLAN-REVIEW-LOG.md` at repo root are session 10 artifacts, still untracked — left untouched this session, not part of the deploy.

## Open items / not started
- Main JS chunk (1.1MB) + `pdf.worker` chunk (1.24MB) exceed Vite's 500KB chunk-size guideline — pre-existing, not addressed, worth a code-splitting pass eventually but out of scope for a deploy session.
- The cosmetic 403 on global sign-out (flagged session 10) — still not investigated, still non-blocking.
- `archivist`/`chapter-translator`'s unpinned `npm:@anthropic-ai/sdk` import and stale model id — still flagged since session 9, still out of scope.
- No password-reset/account-recovery UI on `/premed`'s inline auth panel — still not requested.

## Suggested skills for the next session
- **`superpowers:verification-before-completion`** — reused again this session for the secret-leakage proof (positive control before trusting a negative grep result) and for the blank-page root-cause diagnosis (checked the actual code path that throws, rather than guessing).

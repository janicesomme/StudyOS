# Plan Review Log: /premed goes multi-user (session 10)
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.

## Round 1 — Codex
- `useRealProfileData(supabase, userId)` is called unconditionally in `PremedDashboard` — React hooks can't be conditionally invoked, so "only invoked when userId is non-null" as written is impossible. Fix: widen the hook to accept `string | null` and no-op/reset internally, or split into a child component.
- No cancellation/staleness guard on the hook's fetch — a slow fetch for user A could commit state after sign-out or after switching to user B. Fix: guard committed state with a ref/request-id check.
- `SignupForm` emits `(name, email, password)`; `useAuth().signUp` expects `(email, password, name)` — "wired directly" as planned is a parameter-order bug. Fix: an adapter handler in `PremedPage`, not a direct prop pass.
- Plan assumes signup immediately produces a session, but Supabase can require email confirmation (project-setting-dependent) — `signUp` can succeed with no session. Fix: branch on whether a session came back; show "check your email" if not.
- Hiding the "Real profile" button when logged out doesn't stop stale `mode: 'real'` state (from before sign-out) driving broken rendering. Fix: derive effective mode as `userId ? mode : 'demo'`.
- `EssayReviewSection` auth-transition safety (sign-out mid-submit) untested.
- RLS check as worded ("direct anon-key query with no JWT") only proves anonymous access is blocked, not that account A can't see account B specifically. Fix: query as account A's authenticated session against account B's known ids.
- Thin observability for the one live paid check — record profile ids/status in the handoff.
- No route-level regression test confirming `/premed` is public while other routes stay protected.
- "287 tests stay green" is optimistic given the `devUserId`→`userId` rename — grep all usages first, typecheck as an explicit gate.

VERDICT: REVISE

### Claude's response
All ten accepted — every one is either a real correctness bug or a cheap, concrete hardening with no real cost:
- `useRealProfileData` widened to accept `userId: string | null`; returns immediately with empty/default state (no fetch) when `null`, without restructuring `PremedDashboard` into a child component.
- Added a request-guard (capture `userId` at fetch-start, compare before committing state) to `useRealProfileData`'s `refetch`, closing the stale-state-after-sign-out/switch race.
- `PremedPage` gets an explicit adapter — `handleSignup(name, email, password) => useAuth().signUp(email, password, name)` — not a raw prop pass.
- Signup handler now checks `data.session` after `signUp()`; if absent, shows a "check your email to confirm your account" message instead of assuming the logged-in view will appear.
- `PremedDashboard` derives `effectiveMode = userId ? mode : 'demo'` for all rendering decisions, so stale `mode: 'real'` state can't leak through after sign-out.
- Added `App.tsx` routing test: `/premed` renders without redirect when logged out; `/dashboard` still redirects to `/login`.
- Added an explicit "grep all `devUserId` usages, run typecheck" step before the "287 stay green" claim, rather than asserting it optimistically.
- RLS check methodology corrected: account A's authenticated session queries account B's specific known row ids (profile/activity/essay-review), expecting empty/blocked — not an unauthenticated query.
- Handoff will record profile ids + request status for the one live paid check (no essay text).
- `EssayReviewSection` sign-out-mid-submit: acknowledged as a real but extremely low-probability edge case for a single-operator session; not adding new guard code for it (React 18 silently no-ops a state update on an unmounted component) — logged as an accepted risk rather than silently dropped.

## Round 2 — Codex
- Contradiction: step 2 keeps `DashboardShell` for the logged-in `/premed` view, but `DashboardShell`'s built-in sign-out unconditionally navigates to `/login` — directly violating the "stay on /premed" decision. Fix: either drop `DashboardShell` for this route or give it an override callback.
- `useAuth.signUp` currently returns only `{ error }`, not `data.session` — `PremedPage` can't "check whether a session comes back" without widening the hook's return shape first.
- The new signup-based RLS test account may never become usable if email confirmation is enabled and `test.local` has no real inbox to confirm from.
- `loggedOutSlot`'s placement is ambiguous and can become unreachable: if all rendering keys off `effectiveMode = userId ? mode : 'demo'`, and real-mode content (where the plan said `loggedOutSlot` renders) is gated behind `mode === 'real'`, then forcing `effectiveMode` to `'demo'` for logged-out users means that branch never executes — `loggedOutSlot` would never render at all.
- The stale-state guard ("captures the userId it started fetching for") isn't concrete enough to actually implement safely without a named ref/mechanism.
- `useRealProfileData(userId: null)`'s "no-op, return default state" doesn't explicitly say `loading` must be `false` — the hook's current initial state defaults `loading: true`, so an unspecified null branch risks a permanently-loading logged-out UI.

VERDICT: REVISE

### Claude's response
All six accepted — every one is a concrete implementation bug, not a style preference:
- Resolved the `DashboardShell` contradiction: it gains a new optional `onSignOut?: () => void` prop (backward-compatible — every other caller keeps today's exact behavior). When provided, `DashboardShell`'s sign-out button calls it instead of `signOut()` + `navigate('/login')`. `PremedPage` passes `onSignOut={() => auth.signOut()}` (no navigation), so the session clears and `PremedPage` re-renders into its own logged-out branch while `DashboardShell` unmounts naturally.
- `useAuth.signUp` widened to return `{ error: Error | null, session: Session | null }` (reads `data.session` from the existing `supabase.auth.signUp()` call, which already returns it — just wasn't being surfaced). `SignupPage`'s existing call site (`const { error } = await signUp(...)`) is unaffected by the extra field.
- RLS test account: use the real signup form (preserves the original intent — exercise the built feature), but if the signup response comes back with no session (confirmation required), immediately call `supabase.auth.admin.updateUserById(id, { email_confirm: true })` on that same just-created account via the service-role key, rather than abandoning the real-signup path for a fully admin-created account. Decided empirically at implementation time based on what the actual signup call returns, not guessed in advance.
- Fixed the `loggedOutSlot` logic bug directly: when `userId === null`, the demo archetype switcher + read-out renders (via `effectiveMode === 'demo'`) AND `loggedOutSlot` renders in its own dedicated slot alongside it (not nested inside any `mode === 'real'` branch) — both visible together, not one replacing the other conditionally on mode.
- Stale-state guard specified concretely: a `currentUserIdRef` (or equivalent) updated at the start of every `refetch`/effect run, checked immediately before every `setState` call inside that fetch — any commit where the ref no longer matches the fetch's own captured `userId` is dropped.
- `useRealProfileData`'s `userId === null` branch specified exactly: `{ profile: null, activities: [], activityGaps: null, poolPositions: null, gapAnalysis: null, essayReviews: [], loading: false, error: null, refetch }` — no Supabase calls, `loading` explicitly `false`.

## Round 3 — Codex
Most prior findings confirmed addressed. Four remaining:
- The email-confirmation contingency needs the new user's id for `admin.updateUserById`, but the revised `useAuth.signUp` only returns `{ error, session }` — when confirmation is required, `session` is null and there's no stated way to get the id. Fix: also return `user` from `signUp`.
- `DashboardShell`'s `onSignOut?: () => void` is too narrow for `auth.signOut()`, which is async — implemented literally, the button won't await it. Fix: type as `() => Promise<void> | void`, await in the handler.
- Live RLS check only covers cross-account reads; the dashboard also writes to `pm_profiles`/`pm_activities`/`pm_essay_reviews`. Fix: add negative write checks (account A attempting update/insert/delete against account B's ids, expecting RLS-blocked).
- Declaring `SignupPage` "unaffected" by the widened `signUp` return isn't accurate: if confirmation is enabled, it still navigates to `/dashboard` on a no-session success today, causing a confusing redirect-to-login loop. Fix: update `SignupPage` too, or explicitly accept the existing regression as out of scope.

VERDICT: REVISE

### Claude's response
All four accepted:
- `useAuth.signUp` widened once more to `{ error: Error | null, session: Session | null, user: User | null }` — `data.user` is always present on a successful signup regardless of confirmation status, giving the live-verification script the id it needs for `admin.updateUserById` without a separate email lookup.
- `DashboardShell`'s new prop typed `onSignOut?: () => Promise<void> | void`; its `handleSignOut` awaits it (or the default `signOut()`) before any `navigate()` call.
- Live RLS verification step 6 extended: after the read checks, account A also attempts an update/insert/delete against account B's known row ids on the same three tables, expecting RLS to block every one (not the service-role bypass CLIs use).
- `SignupPage` updated in the same small pass as `PremedPage` and `useAuth`: branches on `session` exactly like `PremedPage`'s `handleSignup` — navigates to `/dashboard` only when a session comes back, otherwise shows the same "check your email" message. Since this session is already changing `useAuth.signUp`'s return shape, leaving a newly-exposed regression in a page two clicks away from the one being built was judged not worth deferring — it's the same fix pattern, applied twice, not new design.

## Round 4 — Codex
Prior blockers confirmed addressed (signUp's user+session, SignupPage fix, async onSignOut, RLS read+write checks, loggedOutSlot/effectiveMode/null-hook-state clarity). No remaining material plan flaw. Two implementation-quality notes, not blockers: keep the service-role email-confirmation step server-side only (never in browser code), and make the RLS write checks non-destructive or against throwaway rows where possible.

VERDICT: APPROVED

**Converged after 4 rounds.** Both implementation notes carried into execution: the `admin.updateUserById` confirmation call runs from a Node script with the service-role key (never shipped to the browser, same discipline as every prior session's CLIs/Edge Functions), and the write-check step targets a harmless field update rather than delete against real data — if RLS is working, nothing is written either way; the risk being tested for is exactly "RLS incorrectly allows it," so the check itself must not assume success is safe to leave in place.

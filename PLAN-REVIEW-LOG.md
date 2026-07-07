# Plan Review Log: Rubric Calibration Benchmark + Essay Review Render Fixes (session 12)
Act 1 (grill) complete — plan locked with the user. MAX_ROUNDS=5.
Thread ID: 019f3995-552a-7de2-90a3-90d26890a939

## Round 1 — Codex
VERDICT: REVISE

1. Plan names `premed/src/components/EssayReviewSection.tsx` — actual path is `premed/src/ui/sections/EssayReviewSection.tsx`.
2. Calibration idempotency is only an app-level pre-check — two runs can race and insert duplicates.
3. `scores jsonb` is unconstrained — malformed rows could silently break stats/UI.
4. No defined overlay behavior for a dimension (e.g. `mission_fit`) present in a review but absent from calibration data.
5. Legal/copyright: `Content-Signal: ai-train=no, use=reference` vs. sending full copyrighted essays to a model.
6. "Honest User-Agent" framing doesn't resolve the compliance question on its own.
7. Splitting raw HTML on the `ESSAY` marker is brittle; the >100-word guard won't catch a bad split that still looks plausible.
8. "Accepted-essay range" label implies a statistically representative accepted-applicant sample; source is one sponsored/editorial collection.
9. Silent overlay-fetch failure hides real errors (RLS/schema/migration) from developers, not just "no data yet."
10. No `PmRubricCalibrationSchema` planned in `schemas.ts`.
11. Prose-guard cap raise (15→40) needs an explicit test that the guard still fires at the new boundary, not just "still capped."
12. Cost gate only checks estimates before each call — actual output could exceed the estimate mid-run.
13. No `package.json` script planned for `calibrate-rubric.ts`.
14. No-essay-text-persisted guard only covers the row-builder function, not logging/errors/parser debug output.
15. No post-migration verification step (table exists, RLS-readable) before frontend/live-run work.

### Claude's response
Verified #1 against the actual `PLAN.md` text — it never states that path; rejected as a false premise (added the correct full path for clarity anyway, at zero cost).

Accepted and folded into the plan: #2 (DB `UNIQUE (rubric_version, source_url, source_label)` + `upsert` on conflict), #3 (Zod validation as the actual enforcement point — explicit reason logged for not also adding a SQL `CHECK` on jsonb shape: single writer, disproportionate migration complexity), #4 (overlay omits band/tick for uncalibrated dimensions, tested), #7 (JSDOM parse, hard-fail on != 10 blocks, print label+word-count pre-`--go`), #9 (distinguish empty-result from fetch-error, `console.error` on the latter), #10 (`PmRubricCalibrationSchema` added), #11 (boundary test at the new 40-word cap), #13 (npm script added), #14 (explicit rule: no essay text/substrings in any console output or thrown-error message from `calibrate-rubric.ts`), #15 (post-migration service-role read-count check before frontend wiring or live run).

Rejected #12: matches this codebase's existing shipped cost-gate pattern (`review-essay.ts`, `scrape-class-profiles.ts`) exactly — estimate-then-print-then-`--go`, running-cost checked before each call against a $5 cap. Worst case for this run (10 calls × `max_tokens: 2000` output ceiling) is ~$0.30 in output cost alone, far under the $5 cap; introducing a stricter worst-case-projection mechanism here would be inconsistent with every other cost-gated script already shipped in this codebase for a run that doesn't need it.

Rejected #6 as a standalone action: already correctly scoped as a downstream-use policy question, not a fetch-identity question — folded into #5's resolution rather than treated separately.

#5 and #8 were elevated to the user directly (business/legal and product-copy judgment calls, not engineering decisions I should make unilaterally):
- **Copyright/reference-use**: user confirmed proceeding — one-time scoring inference (no storage, no training, no redistribution) is acceptable under "reference" use.
- **Benchmark label**: user confirmed keeping "Accepted-essay range" as originally specified — `n=X` disclosure is sufficient.

`PLAN.md` revised accordingly. Proceeding to round 2.

## Round 2 — Codex
VERDICT: REVISE ("Prior findings mostly addressed: correct component path, DB uniqueness/upsert, schema typing, mission-fit omission, package script, parser hard-fail, and no-text logging are now covered.")

1. Cost cap still not truly hard — projections use average estimated output, not worst-case `max_tokens`; a single call's actual output could exceed the estimate.
2. Post-migration verification used the service-role client only — bypasses RLS, doesn't prove the browser's anon-key client can actually read the table.
3. `rubric-calibration.ts` is described as shared between the pipeline and the browser; if `jsdom`/DOM-parsing code lands there, Vite may try to bundle a Node-only dependency into the frontend.
4. "Accepted-essay range" label still flagged as overstated for one sponsored Crimson sample, even with `n=X`.
5. No-text-persistence test still only covers the row-builder shape, not parse/cost-plan console output.

### Claude's response
Reconsidered #1 rather than repeating round 1's rejection: the fix (project each next call using `max_tokens: 2000` — the value `reviewEssay` actually passes to the API — instead of the average-case `ESTIMATED_OUTPUT_TOKENS` guess) is a one-constant change, doesn't alter the printed estimate in any way that matters for a 10-essay run (worst case ~$0.35, still far under $5), and makes the stop-mid-run guarantee actually true instead of usually-true. Accepted, scoped to `calibrate-rubric.ts` only — not retroactively applied to `review-essay.ts`/`scrape-class-profiles.ts` (their own hardening is a separate, out-of-scope effort).

Accepted #2: added an anon-key-client read check alongside the service-role check — the service-role check only proves the table exists, never proves RLS actually grants read to the identity the browser uses.

Accepted #3: made explicit in the plan that `rubric-calibration.ts` contains stats math only (no `jsdom`, no Node-only imports, never receives the parsing logic) — this was already the structural intent in round 1's revision but hadn't been stated as an explicit constraint, so worth hardening into the plan text directly rather than leaving it inferable.

Accepted #5: split the no-text-persistence test into two — the existing row-builder-shape test, plus a new test asserting the pipeline's console-summary formatters (pure functions over labels/counts) never leak a fixture essay substring even when fed one.

Rejected #4 (repeat of round 1's #8): already elevated to the user in round 1 with this exact concern in front of them, and explicitly settled — user confirmed keeping "Accepted-essay range" as originally specified. Re-raising the identical point doesn't introduce new information; not re-litigating a decision the user already made with full context.

`PLAN.md` revised accordingly. Proceeding to round 3.

## Round 3 — Codex
VERDICT: APPROVED

"The last five findings are addressed: worst-case output cost is now used, anon/RLS verification is specified, JSDOM is kept pipeline-only, no-text logging tests are added, and the label issue is explicitly documented as a user-confirmed product/legal choice rather than an unexamined assumption. No new material implementation blockers found. The only residual risk is that the parser itself still deserves a small fixture test, but the plan's hard fail on exactly 10 blocks plus pre-`--go` word-count review is enough for this one-off pipeline."

### Claude's response
Non-blocking suggestion (Codex's own framing) — folded in anyway since it's cheap: adding one small fixture test for the essay-block parser (feed it a minimal fake HTML doc with a handful of `ESSAY` markers, assert correct block count/boundaries) alongside the existing hard-fail-on-!=10 runtime check.

**Converged after 3 rounds.** No unresolved disagreements — every finding was either accepted and folded in, or rejected with a logged reason the user was present for (the two judgment calls) or that held up on inspection (the false-premise path claim). Proceeding to user sign-off before any code is written.

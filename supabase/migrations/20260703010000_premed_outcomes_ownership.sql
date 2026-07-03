-- Premed session 6 — pm_outcomes_corpus ownership pivot.
-- Run this once in the Supabase SQL editor (this repo has no automated migration runner).
--
-- Session 1 designed pm_outcomes_corpus as an anonymous third-party corpus
-- table (scraped data, no owner column, RLS enabled with zero policies
-- pending a confirmed data source/license — see 20260702000000). Session 6
-- was scoped to scrape r/premed and SDN for that corpus, but step 0 (source
-- compliance check) surfaced real, unresolved risk: neither Reddit's nor
-- SDN's current ToS could be verified from primary sources, and Reddit is
-- actively litigating Anthropic over a related (not identical) scraping
-- fact pattern. The user chose to skip both sources and pivot to first-party
-- self-reported data instead: a user records their own cycle outcome, with
-- explicit consent, visible only to them. That requires an owner column,
-- which the original table never had — hence this migration.
--
-- pm_outcomes_corpus is currently empty (never populated in sessions 1-5),
-- so both new columns can be added directly without a backfill step.

ALTER TABLE pm_outcomes_corpus
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN consent_to_store boolean NOT NULL DEFAULT false;

-- One outcome report per user per cycle year — re-reporting updates in place.
ALTER TABLE pm_outcomes_corpus
  ADD CONSTRAINT pm_outcomes_corpus_user_cycle_key UNIQUE (user_id, cycle_year);

-- Reclassify from "pending-source, zero policies" to "user-owned" — same
-- four-policy pattern as pm_profiles (direct auth.uid() = user_id, this
-- table now has its own user_id rather than needing a join).
CREATE POLICY "pm_outcomes_corpus_select_own" ON pm_outcomes_corpus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pm_outcomes_corpus_insert_own" ON pm_outcomes_corpus FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_outcomes_corpus_update_own" ON pm_outcomes_corpus FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_outcomes_corpus_delete_own" ON pm_outcomes_corpus FOR DELETE USING (auth.uid() = user_id);

-- ── Verification (copy-paste into the Supabase SQL editor after applying) ────
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns
--   WHERE table_name = 'pm_outcomes_corpus' AND column_name IN ('user_id', 'consent_to_store');
-- SELECT tablename, COUNT(*) AS policy_count FROM pg_policies
--   WHERE tablename = 'pm_outcomes_corpus' GROUP BY tablename;  -- expect 4

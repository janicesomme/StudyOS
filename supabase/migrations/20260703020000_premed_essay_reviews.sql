-- Premed session 8 — Committee Simulator essay review persistence.
-- Run this once in the Supabase SQL editor (this repo has no automated migration runner).
--
-- pm_essay_reviews stores every Committee Simulator run, not just the latest
-- — review history is progress tracking (has this dimension improved across
-- drafts?), so this is an append-only log, never updated in place.
-- User-owned via pm_profiles join (same RLS tier/pattern as pm_activities
-- and pm_narratives) rather than its own user_id column, consistent with
-- how other profile-scoped child tables in this schema are owned.

CREATE TABLE pm_essay_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES pm_profiles(id) ON DELETE CASCADE,
  essay_sha256 text NOT NULL,
  rubric_version text NOT NULL,
  scores jsonb NOT NULL,
  review jsonb NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pm_essay_reviews_profile_id_idx ON pm_essay_reviews(profile_id);

ALTER TABLE pm_essay_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_essay_reviews_select_own" ON pm_essay_reviews FOR SELECT USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_essay_reviews.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_essay_reviews_insert_own" ON pm_essay_reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_essay_reviews.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_essay_reviews_update_own" ON pm_essay_reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_essay_reviews.profile_id AND pm_profiles.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_essay_reviews.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_essay_reviews_delete_own" ON pm_essay_reviews FOR DELETE USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_essay_reviews.profile_id AND pm_profiles.user_id = auth.uid())
);

-- ── Verification (copy-paste into the Supabase SQL editor after applying) ────
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns
--   WHERE table_name = 'pm_essay_reviews' ORDER BY ordinal_position;
-- SELECT tablename, COUNT(*) AS policy_count FROM pg_policies
--   WHERE tablename = 'pm_essay_reviews' GROUP BY tablename;  -- expect 4

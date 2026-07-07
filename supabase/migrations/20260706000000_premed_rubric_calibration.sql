-- Premed session 12 — Committee Simulator rubric calibration benchmark.
-- Run this once in the Supabase SQL editor (this repo has no automated migration runner).
--
-- pm_rubric_calibration stores per-dimension scores from running the
-- Committee Simulator rubric (essay-only mode, no student profile) against a
-- small set of published personal statements, so the dashboard can show a
-- user's own scores against a real accepted-essay range. Reference tier, same
-- RLS pattern as pm_schools/pm_facts_grid: read-open, no write policy — the
-- only writer is premed/pipeline/calibrate-rubric.ts via the service-role key.
--
-- scores is intentionally the only content column. This table never stores
-- essay text, quotes, or any other essay-derived string — see
-- docs/handoffs/2026-07-05-premed-session-12.md for why.
--
-- UNIQUE constraint + upsert-on-conflict (in the pipeline script) is the
-- actual guarantee against duplicate rows for the same essay/rubric version —
-- an application-level "does it exist" pre-check alone can't close that race.

CREATE TABLE pm_rubric_calibration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_label text NOT NULL,
  source_url text NOT NULL,
  rubric_version text NOT NULL,
  scores jsonb NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pm_rubric_calibration_source_version_key UNIQUE (rubric_version, source_url, source_label)
);

ALTER TABLE pm_rubric_calibration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_rubric_calibration_public_read" ON pm_rubric_calibration FOR SELECT USING (true);

-- ── Verification (copy-paste into the Supabase SQL editor after applying) ────
-- SELECT column_name, is_nullable, data_type FROM information_schema.columns
--   WHERE table_name = 'pm_rubric_calibration' ORDER BY ordinal_position;
-- SELECT tablename, COUNT(*) AS policy_count FROM pg_policies
--   WHERE tablename = 'pm_rubric_calibration' GROUP BY tablename;  -- expect 1

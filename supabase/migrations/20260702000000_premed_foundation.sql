-- Premed admissions analysis platform — session 1 foundation.
-- Run this once in the Supabase SQL editor (this repo has no automated migration runner).
-- Naming scheme: pm_{table}

-- ── PROFILES (user-owned) ────────────────────────────────────────────────────
CREATE TABLE pm_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gpa_cum numeric(3,2) CHECK (gpa_cum BETWEEN 0 AND 4.00),
  gpa_science numeric(3,2) CHECK (gpa_science BETWEEN 0 AND 4.00),
  mcat_total int CHECK (mcat_total BETWEEN 472 AND 528),
  mcat_date date,
  state_residence text,
  grad_year int,
  gap_years int NOT NULL DEFAULT 0 CHECK (gap_years >= 0),
  updated_at timestamptz DEFAULT now()
);

-- ── ACTIVITIES (user-owned, via pm_profiles) ─────────────────────────────────
CREATE TABLE pm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES pm_profiles(id) ON DELETE CASCADE,
  category text NOT NULL,
  hours_completed int NOT NULL DEFAULT 0 CHECK (hours_completed >= 0),
  hours_planned int NOT NULL DEFAULT 0 CHECK (hours_planned >= 0),
  start_date date,
  end_date date,
  competencies text[],
  narrative_theme text,
  description text
);

-- ── SCHOOLS (confirmed-public reference) ─────────────────────────────────────
CREATE TABLE pm_schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  public_private text CHECK (public_private IN ('public', 'private')),
  mission_keywords text[],
  class_size int CHECK (class_size >= 0)
);

-- ── SCHOOL STATS (pending-source reference — not populated this session) ─────
CREATE TABLE pm_school_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES pm_schools(id) ON DELETE CASCADE,
  cycle_year int NOT NULL,
  median_gpa numeric(3,2) CHECK (median_gpa BETWEEN 0 AND 4.00),
  median_mcat int CHECK (median_mcat BETWEEN 472 AND 528),
  pct_instate numeric(4,1) CHECK (pct_instate BETWEEN 0 AND 100),
  pct_gap_year numeric(4,1) CHECK (pct_gap_year BETWEEN 0 AND 100),
  median_clinical_hours int CHECK (median_clinical_hours >= 0),
  median_research_hours int CHECK (median_research_hours >= 0),
  pct_with_publications numeric(4,1) CHECK (pct_with_publications BETWEEN 0 AND 100),
  source text,
  CONSTRAINT pm_school_stats_school_cycle_key UNIQUE (school_id, cycle_year)
);

-- ── OUTCOMES CORPUS (pending-source reference — not populated this session) ──
CREATE TABLE pm_outcomes_corpus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_year int,
  gpa numeric(3,2) CHECK (gpa BETWEEN 0 AND 4.00),
  mcat int CHECK (mcat BETWEEN 472 AND 528),
  state text,
  clinical_hours int CHECK (clinical_hours >= 0),
  research_hours int CHECK (research_hours >= 0),
  volunteer_hours int CHECK (volunteer_hours >= 0),
  has_publication boolean,
  gap_years int CHECK (gap_years >= 0),
  schools_applied int CHECK (schools_applied >= 0),
  interviews int CHECK (interviews >= 0),
  acceptances int CHECK (acceptances >= 0),
  matriculated_school_id uuid REFERENCES pm_schools(id),
  raw_source_url text
);

-- ── NARRATIVES (user-owned, via pm_profiles) ─────────────────────────────────
CREATE TABLE pm_narratives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES pm_profiles(id) ON DELETE CASCADE,
  theme text NOT NULL,
  supporting_activity_ids uuid[],
  mission_fit_school_ids uuid[],
  strength_score int CHECK (strength_score BETWEEN 0 AND 100),
  updated_at timestamptz DEFAULT now()
);

-- ── FACTS GRID (confirmed-public reference — AAMC national GPA×MCAT grid) ────
-- AAMC Table A-23 reports "Applicants" and "Acceptees" (offered admission, not
-- necessarily enrolled) — there is no matriculant-level version of this grid.
-- Cells with fewer than 10 applicants are suppressed by AAMC for privacy (shown
-- as "-" in the source workbook); those are stored as NULL with *_suppressed=true
-- rather than 0, so downstream consumers can distinguish "zero" from "unknown 1-9".
CREATE TABLE pm_facts_grid (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_year int NOT NULL,
  gpa_band text NOT NULL,
  mcat_band text NOT NULL,
  applicants int CHECK (applicants >= 0),
  applicants_suppressed boolean NOT NULL DEFAULT false,
  acceptees int CHECK (acceptees >= 0),
  acceptees_suppressed boolean NOT NULL DEFAULT false,
  source_file text NOT NULL,
  source_sheet text NOT NULL,
  source_sha256 text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pm_facts_grid_cycle_gpa_mcat_key UNIQUE (cycle_year, gpa_band, mcat_band),
  CONSTRAINT pm_facts_grid_applicants_suppressed_consistent
    CHECK (applicants_suppressed = (applicants IS NULL)),
  CONSTRAINT pm_facts_grid_acceptees_suppressed_consistent
    CHECK (acceptees_suppressed = (acceptees IS NULL))
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX pm_activities_profile_id_idx ON pm_activities(profile_id);
CREATE INDEX pm_school_stats_school_id_idx ON pm_school_stats(school_id);
CREATE INDEX pm_outcomes_corpus_matriculated_school_id_idx ON pm_outcomes_corpus(matriculated_school_id);
CREATE INDEX pm_narratives_profile_id_idx ON pm_narratives(profile_id);
CREATE INDEX pm_facts_grid_cycle_year_idx ON pm_facts_grid(cycle_year);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE pm_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_activities      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_schools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_school_stats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_outcomes_corpus ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_narratives      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_facts_grid      ENABLE ROW LEVEL SECURITY;

-- User-owned: auth.uid() = user_id (direct on pm_profiles, via join elsewhere)
CREATE POLICY "pm_profiles_select_own" ON pm_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pm_profiles_insert_own" ON pm_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_profiles_update_own" ON pm_profiles FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pm_profiles_delete_own" ON pm_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "pm_activities_select_own" ON pm_activities FOR SELECT USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_activities.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_activities_insert_own" ON pm_activities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_activities.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_activities_update_own" ON pm_activities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_activities.profile_id AND pm_profiles.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_activities.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_activities_delete_own" ON pm_activities FOR DELETE USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_activities.profile_id AND pm_profiles.user_id = auth.uid())
);

CREATE POLICY "pm_narratives_select_own" ON pm_narratives FOR SELECT USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_narratives.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_narratives_insert_own" ON pm_narratives FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_narratives.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_narratives_update_own" ON pm_narratives FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_narratives.profile_id AND pm_profiles.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_narratives.profile_id AND pm_profiles.user_id = auth.uid())
);
CREATE POLICY "pm_narratives_delete_own" ON pm_narratives FOR DELETE USING (
  EXISTS (SELECT 1 FROM pm_profiles WHERE pm_profiles.id = pm_narratives.profile_id AND pm_profiles.user_id = auth.uid())
);

-- Confirmed-public reference: public read, no write policy (service role bypasses RLS)
CREATE POLICY "pm_schools_public_read" ON pm_schools FOR SELECT USING (true);
CREATE POLICY "pm_facts_grid_public_read" ON pm_facts_grid FOR SELECT USING (true);

-- Pending-source reference: RLS enabled, intentionally zero policies (service-role only)
-- until pm_school_stats / pm_outcomes_corpus have a confirmed data source and license status.

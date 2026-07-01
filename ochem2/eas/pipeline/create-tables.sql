-- Run this once in the Supabase SQL editor before running load-supabase.ts
-- Naming scheme: o{course}_{topic}_{table}  (o2 = ochem2)

-- ── PROBLEMS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS o2_eas_problems (
  id                    TEXT        PRIMARY KEY,
  source                TEXT        NOT NULL,
  chapter               INTEGER     NOT NULL,
  problem_number        TEXT        NOT NULL,
  question_text_raw     TEXT        NOT NULL,
  solution_text_raw     TEXT        NOT NULL,
  question_analysis     JSONB,
  prior_knowledge_needed JSONB,
  decomposition_type    TEXT        CHECK (decomposition_type IN ('specific', 'framework')),
  solution_status       TEXT        NOT NULL CHECK (solution_status IN ('solved', 'unsolved')),
  has_missing_structure BOOLEAN     NOT NULL DEFAULT false,
  -- nullable future columns
  topic                 TEXT,
  question_type         TEXT,
  difficulty            INTEGER,
  high_yield            BOOLEAN,
  readiness_category    TEXT,
  hint_1                TEXT,
  hint_2                TEXT,
  checklist_hint        TEXT,
  common_trap           TEXT,
  memory_trick          TEXT,
  needs_image           BOOLEAN,
  expected_image_types  JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── SOLUTION STEPS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS o2_eas_solution_steps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  TEXT        NOT NULL REFERENCES o2_eas_problems(id) ON DELETE CASCADE,
  step_order  INTEGER     NOT NULL,
  do_this     TEXT        NOT NULL,
  why         TEXT        NOT NULL,
  vocab       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT o2_eas_solution_steps_problem_step_key UNIQUE (problem_id, step_order)
);

-- ── IMAGES ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS o2_eas_images (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id    TEXT        NOT NULL REFERENCES o2_eas_problems(id) ON DELETE CASCADE,
  image_type    TEXT        NOT NULL,
  display_order INTEGER     NOT NULL DEFAULT 0,
  caption       TEXT,
  storage_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS o2_eas_problems_source_idx         ON o2_eas_problems(source);
CREATE INDEX IF NOT EXISTS o2_eas_problems_problem_number_idx ON o2_eas_problems(problem_number);
CREATE INDEX IF NOT EXISTS o2_eas_steps_problem_id_idx        ON o2_eas_solution_steps(problem_id);
CREATE INDEX IF NOT EXISTS o2_eas_images_problem_id_idx       ON o2_eas_images(problem_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE o2_eas_problems       ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2_eas_solution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE o2_eas_images         ENABLE ROW LEVEL SECURITY;

-- Public read (no auth required)
CREATE POLICY "o2_eas_problems_public_read"
  ON o2_eas_problems FOR SELECT USING (true);

CREATE POLICY "o2_eas_solution_steps_public_read"
  ON o2_eas_solution_steps FOR SELECT USING (true);

CREATE POLICY "o2_eas_images_public_read"
  ON o2_eas_images FOR SELECT USING (true);

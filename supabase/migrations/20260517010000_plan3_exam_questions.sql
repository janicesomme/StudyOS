-- exam_questions: structured question bank for Ochem 1 exam prep.
-- Each row is one exam question with full teaching logic attached.
-- Feeds worksheet generation, difficulty routing, and progress tracking.

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,

  -- Identity
  q_id TEXT NOT NULL,                       -- sequential ID e.g. "Q1", "Q17"
  source_doc TEXT NOT NULL,                 -- e.g. "acid_base_question_bank_001.pdf"
  source_page TEXT,                         -- e.g. "4-5"
  question_type TEXT NOT NULL,              -- description of what the question asks

  -- Classification
  pack TEXT,                                -- e.g. "Pack 1", "Pack 2", "Pack 1 + 2"
  pattern TEXT,                             -- e.g. "P1", "P4", "P4, P5"
  difficulty TEXT NOT NULL CHECK (difficulty IN ('E', 'P+', 'INT', 'ADV')),
  suitable_use TEXT,                        -- e.g. "Automaticity mission", "Mixed worksheet", "Later/hard worksheet"

  -- Teaching logic (the six card fields)
  janice_shortcut TEXT,                     -- one or two sentence exam-pressure shortcut
  student_visible_trigger TEXT,             -- what the student sees that tells them which pattern to use
  what_student_does TEXT,                   -- step-by-step description of the mechanical move
  struggle_point TEXT,                      -- what students without this system typically get wrong
  why_easy_in_system TEXT,                  -- why our system makes this tractable
  pre_lesson_needed TEXT,                   -- prerequisite patterns and packs

  -- Content grounding
  topics TEXT[] DEFAULT '{}',              -- e.g. ["acid-base", "conjugate pairs", "pKa"]
  reagents_involved TEXT[] DEFAULT '{}',   -- full reagent names (mirrors reagents.full_name)
  vocab_needed TEXT[] DEFAULT '{}',        -- key vocab terms the student must know

  -- Layer connections
  related_knowledge_unit_ids UUID[] DEFAULT '{}',  -- links to knowledge_units rows

  -- Status
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exam_questions_course ON exam_questions (course_id);
CREATE INDEX idx_exam_questions_student ON exam_questions (student_id);
CREATE INDEX idx_exam_questions_difficulty ON exam_questions (difficulty);
CREATE INDEX idx_exam_questions_q_id ON exam_questions (q_id);

ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eq_select_own" ON exam_questions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "eq_insert_own" ON exam_questions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "eq_update_own" ON exam_questions FOR UPDATE
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "eq_delete_own" ON exam_questions FOR DELETE USING (auth.uid() = student_id);

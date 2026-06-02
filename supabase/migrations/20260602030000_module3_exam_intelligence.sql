-- supabase/migrations/20260602030000_module3_exam_intelligence.sql
-- MANUAL STEP REQUIRED: This migration must be run manually.
-- Paste the contents of this file into the Supabase dashboard SQL editor and execute it.
-- Do NOT run via Supabase CLI (no local Docker in this project).

-- source_exams: one row per exam file (question sheet + key pair)
CREATE TABLE source_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,        -- e.g. 'JRF', 'CHM'
  year INT NOT NULL,                 -- e.g. 2017
  exam_number INT NOT NULL,          -- 1, 2, 3, 4
  original_filename TEXT NOT NULL,   -- e.g. '11JRF17ex1.pdf'
  question_count INT,                -- populated after parse
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, original_filename)
);

CREATE INDEX idx_source_exams_course ON source_exams (course_id);

ALTER TABLE source_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "se_select_own" ON source_exams FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "se_insert_own" ON source_exams FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "se_delete_own" ON source_exams FOR DELETE USING (auth.uid() = student_id);
CREATE POLICY "se_update_own" ON source_exams FOR UPDATE
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Add Module 3 columns to exam_questions
ALTER TABLE exam_questions
  ADD COLUMN IF NOT EXISTS hint TEXT,
  ADD COLUMN IF NOT EXISTS answer_image_url TEXT,
  ADD COLUMN IF NOT EXISTS source_exam_id UUID REFERENCES source_exams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exam_number INT,
  ADD COLUMN IF NOT EXISTS exam_year INT,
  ADD COLUMN IF NOT EXISTS question_order INT,
  ADD COLUMN IF NOT EXISTS point_value INT,
  ADD COLUMN IF NOT EXISTS sub_parts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_structure BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS raw_text TEXT;

CREATE INDEX IF NOT EXISTS idx_exam_questions_source_exam ON exam_questions (source_exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_number ON exam_questions (exam_number);

-- source_materials
CREATE TABLE source_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'txt')),
  file_url TEXT NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processing', 'complete', 'failed', 'partial')),
  extraction_confidence NUMERIC(3,2),
  needs_review BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- knowledge_units (atomic heart of the system)
CREATE TABLE knowledge_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  source_material_id UUID NOT NULL REFERENCES source_materials(id) ON DELETE CASCADE,
  concept_name TEXT NOT NULL,
  plain_english_explanation TEXT NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  prerequisite_concept_ids UUID[] DEFAULT '{}',
  common_misconceptions TEXT[] DEFAULT '{}',
  testability_score INTEGER CHECK (testability_score BETWEEN 1 AND 5),
  extraction_confidence NUMERIC(3,2),
  source_location TEXT,
  created_by_agent TEXT NOT NULL DEFAULT 'archivist',
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_source_materials_course ON source_materials(course_id);
CREATE INDEX idx_source_materials_student ON source_materials(student_id);
CREATE INDEX idx_knowledge_units_course ON knowledge_units(course_id);
CREATE INDEX idx_knowledge_units_source ON knowledge_units(source_material_id);
CREATE INDEX idx_knowledge_units_student ON knowledge_units(student_id);

ALTER TABLE source_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sm_select_own" ON source_materials FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "sm_insert_own" ON source_materials FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sm_update_own" ON source_materials FOR UPDATE
  USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "sm_delete_own" ON source_materials FOR DELETE USING (auth.uid() = student_id);

CREATE POLICY "ku_select_own" ON knowledge_units FOR SELECT USING (auth.uid() = student_id);

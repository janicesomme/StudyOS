-- Plan 1: Foundation migration
-- Tables: students, student_profile, courses
-- students is created by trigger from auth.users -- never inserted by client

-- students (id = auth.users.id)
CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_profile (one per student, auto-created by trigger)
CREATE TABLE student_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'reading_writing', 'kinesthetic')),
  attention_span_minutes INTEGER,
  academic_level TEXT CHECK (academic_level IN ('high_school', 'college')),
  pressure_context TEXT,
  goals TEXT,
  preferred_explanation_styles JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  institution TEXT,
  semester TEXT,
  exam_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common course queries
CREATE INDEX idx_courses_student ON courses(student_id);

-- Trigger 1: auto-create students row when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.students (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger 2: auto-create student_profile when students row is created
CREATE OR REPLACE FUNCTION handle_new_student()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.student_profile (student_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_student_created
  AFTER INSERT ON public.students
  FOR EACH ROW EXECUTE FUNCTION handle_new_student();

-- Enable RLS on all 3 tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS: students (trigger handles INSERT via SECURITY DEFINER -- no INSERT policy needed)
CREATE POLICY "students_select_own"
  ON students FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "students_update_own"
  ON students FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS: student_profile (trigger handles INSERT via SECURITY DEFINER -- no INSERT policy needed)
CREATE POLICY "student_profile_select_own"
  ON student_profile FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "student_profile_update_own"
  ON student_profile FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- RLS: courses (client manages all operations)
CREATE POLICY "courses_select_own"
  ON courses FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "courses_insert_own"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "courses_update_own"
  ON courses FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "courses_delete_own"
  ON courses FOR DELETE
  USING (auth.uid() = student_id);

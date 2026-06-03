-- Module 2: add image support columns to exam_questions
ALTER TABLE exam_questions ADD COLUMN image_url TEXT;
ALTER TABLE exam_questions ADD COLUMN ai_tagged BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE exam_questions ADD COLUMN answer_key TEXT;

-- Private storage bucket for drawn exam question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-question-images', 'exam-question-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: students can read their own images (first folder = student_id)
CREATE POLICY "eq_images_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exam-question-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role handles inserts from the ingest script — no anon insert policy needed

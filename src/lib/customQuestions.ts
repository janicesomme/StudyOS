import { z } from 'zod'

// ── Text questions (Module 1 — Claude-generated) ──────────────────────────────
// All five pedagogical fields are required non-empty.

export const ClaudeQuestionSchema = z.object({
  q_id: z.string().min(1),
  source_doc: z.string().min(1),
  source_page: z.string().nullable(),
  question_type: z.string().min(1),
  pack: z.string().nullable(),
  pattern: z.string().nullable(),
  difficulty: z.enum(['E', 'P+', 'INT', 'ADV']),
  suitable_use: z.string().nullable(),
  // Pedagogical fields — required non-empty teaching output
  janice_shortcut: z.string().min(1),
  student_visible_trigger: z.string().min(1),
  what_student_does: z.string().min(1),
  struggle_point: z.string().min(1),
  why_easy_in_system: z.string().min(1),
  pre_lesson_needed: z.string().nullable(),
  topics: z.array(z.string()),
  reagents_involved: z.array(z.string()),
  vocab_needed: z.array(z.string()),
})

export type ClaudeQuestion = z.infer<typeof ClaudeQuestionSchema>

// ── Image questions (Module 2 — ingested from .docx) ─────────────────────────
// The image is the question. Pedagogical text fields are optional — they are
// filled in later by the teacher during review. image_url is required.

export const ImageQuestionSchema = z.object({
  q_id: z.string().min(1),
  source_doc: z.string().min(1),
  source_page: z.string().nullable(),
  question_type: z.string().min(1),   // resolved topic label
  pack: z.string().nullable(),
  pattern: z.string().nullable(),
  difficulty: z.enum(['E', 'P+', 'INT', 'ADV']).default('E'),
  suitable_use: z.string().nullable(),
  janice_shortcut: z.string().nullable(),
  student_visible_trigger: z.string().nullable(),
  what_student_does: z.string().nullable(),
  struggle_point: z.string().nullable(),
  why_easy_in_system: z.string().nullable(),
  pre_lesson_needed: z.string().nullable(),
  topics: z.array(z.string()),
  reagents_involved: z.array(z.string()),
  vocab_needed: z.array(z.string()),
  image_url: z.string().min(1),
  ai_tagged: z.boolean(),
  answer_key: z.string().nullable(),
})

export type ImageQuestion = z.infer<typeof ImageQuestionSchema>

// ── Translator result (Module 1 edge function response) ───────────────────────
// topic_tags: topic labels from the image bank that match this chapter's
// concepts. Empty array when no image bank exists yet.

export const TranslatorResultSchema = z.object({
  concepts: z.array(z.string()).min(1),
  plain_english: z.string().min(1),
  // Optional: absent when course question_source = 'image_bank'
  questions: z.array(ClaudeQuestionSchema).optional().default([]),
  topic_tags: z.array(z.string()).default([]),
})

export type TranslatorResult = z.infer<typeof TranslatorResultSchema>

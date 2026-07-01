import { z } from 'zod'

export const QuestionAnalysisSchema = z.object({
  skill_tested: z.string(),
  disguise: z.string(),
  recognition_cue: z.string(),
})

export const SolutionStepSchema = z.object({
  do_this: z.string(),
  why: z.string(),
  vocab: z.record(z.string(), z.string()).optional(),
})

export const ProblemSchema = z.object({
  id: z.string(),
  source: z.string(),
  chapter: z.number(),
  problem_number: z.string(),
  question_text_raw: z.string(),
  solution_text_raw: z.string(),
  pairing_confidence: z.enum(['high', 'medium', 'low']),
  solution_status: z.enum(['solved', 'unsolved']),
  pairing_note: z.string().optional(),
  has_missing_structure: z.boolean(),
  question_analysis: QuestionAnalysisSchema.optional(),
  prior_knowledge_needed: z.array(z.string()).optional(),
  solution_steps: z.array(SolutionStepSchema).optional(),
})

export type QuestionAnalysis = z.infer<typeof QuestionAnalysisSchema>
export type SolutionStep = z.infer<typeof SolutionStepSchema>
export type Problem = z.infer<typeof ProblemSchema>

import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { RED_FLAGS, RED_FLAG_KEYS, RedFlagKeySchema, RubricDimensionKeySchema, getRubricDimensions } from './rubrics.ts'

// Critique-only essay review. This hard rule is enforced in three places at
// once (prompt instruction, Zod schema shape — there is no "suggestedRewrite"
// field to fill in, and the prose-length guard below) because AMCAS-2026
// compliance and this product's legal/market positioning both depend on it
// never drafting replacement essay text.

const PROSE_GUARD_MAX_WORDS = 40
const TRUNCATION_MARKER = '[...]'

export function countWords(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length
}

/** Truncates to at most maxWords words, appending a marker if anything was cut. Never touches text at or under the limit. */
export function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/)
  if (words.length <= maxWords) return text
  return `${words.slice(0, maxWords).join(' ')} ${TRUNCATION_MARKER}`
}

export const DimensionScoreSchema = z
  .object({
    dimension: RubricDimensionKeySchema,
    score: z.number().int().min(1).max(5),
    // Must be pulled verbatim from the essay — never the model's own words.
    evidenceQuotes: z.array(z.string().min(1)).min(1).max(3),
    challengeQuestion: z.string().min(1).nullable(),
  })
  .refine(d => d.score > 3 || d.challengeQuestion !== null, {
    message: 'challengeQuestion is required for weak dimensions (score <= 3)',
  })
export type DimensionScore = z.infer<typeof DimensionScoreSchema>

export const RedFlagSchema = z
  .object({
    key: RedFlagKeySchema,
    // Always required — a short plain-language explanation of what was
    // flagged and why, so the UI never renders a bare category label with
    // nothing behind it.
    note: z.string().min(1),
    // Verbatim quote from the essay proving the flag. Nullable only for
    // unexplained_gap, which can be inferred from stored profile/activity
    // data the essay never mentions — there's no essay text to quote there.
    evidenceQuote: z.string().min(1).nullable(),
  })
  .refine(f => f.key === 'unexplained_gap' || f.evidenceQuote !== null, {
    message: 'evidenceQuote is required except for unexplained_gap',
  })
export type RedFlag = z.infer<typeof RedFlagSchema>

export const EssayReviewSchema = z.object({
  dimensionScores: z.array(DimensionScoreSchema).min(1),
  strengths: z.array(z.string().min(1)).length(3),
  priorityFixes: z.array(z.string().min(1)).length(3),
  verdict: z.string().min(1),
  consistencyFlags: z.array(z.string().min(1)),
  redFlags: z.array(RedFlagSchema),
})
export type EssayReview = z.infer<typeof EssayReviewSchema>

/** Applies the >15-word prose-strip guard to every generated-commentary field. evidenceQuotes are exempt — they must remain verbatim quotes from the applicant's own text, not generated prose. */
export function applyProseGuard(review: EssayReview): EssayReview {
  return {
    dimensionScores: review.dimensionScores.map(d => ({
      ...d,
      challengeQuestion: d.challengeQuestion === null ? null : truncateToWords(d.challengeQuestion, PROSE_GUARD_MAX_WORDS),
    })),
    strengths: review.strengths.map(s => truncateToWords(s, PROSE_GUARD_MAX_WORDS)) as EssayReview['strengths'],
    priorityFixes: review.priorityFixes.map(s => truncateToWords(s, PROSE_GUARD_MAX_WORDS)) as EssayReview['priorityFixes'],
    verdict: truncateToWords(review.verdict, PROSE_GUARD_MAX_WORDS),
    consistencyFlags: review.consistencyFlags.map(s => truncateToWords(s, PROSE_GUARD_MAX_WORDS)),
    redFlags: review.redFlags.map(f => ({ ...f, note: truncateToWords(f.note, PROSE_GUARD_MAX_WORDS) })),
  }
}

export type ActivitySummary = { category: string; hoursCompleted: number }

export type ReviewPromptInput = {
  essay: string
  activitySummaries?: ActivitySummary[]
  school?: string
  missionKeywords?: string[]
}

export function buildReviewPrompt(input: ReviewPromptInput): string {
  const includeMissionFit = Boolean(input.school)
  const dimensions = getRubricDimensions(includeMissionFit)

  const dimensionBlock = dimensions
    .map(
      d =>
        `- ${d.key}: ${d.description}\n  Score anchors: 1="${d.anchors[0]}" 2="${d.anchors[1]}" 3="${d.anchors[2]}" 4="${d.anchors[3]}" 5="${d.anchors[4]}"\n  Why adcoms weight this: ${d.adcomNotes}`
    )
    .join('\n')

  const activitiesBlock = input.activitySummaries?.length
    ? `\nStored activities on file for this applicant (for consistency checking — flag any essay claim these don't support):\n${input.activitySummaries
        .map(a => `  - ${a.category}: ${a.hoursCompleted} hours logged`)
        .join('\n')}\n`
    : ''

  const missionBlock = input.school
    ? `\nTarget school: ${input.school}. Mission keywords: ${(input.missionKeywords ?? []).join(', ') || '(none on file)'}. Score mission_fit against these keywords specifically — do not reuse another school's mission themes.\n`
    : ''

  const redFlagBlock = RED_FLAG_KEYS.map(k => `- ${k}: ${RED_FLAGS[k].description}`).join('\n')

  return `You are simulating a medical school admissions committee critiquing a personal statement draft.

HARD RULE — CRITIQUE ONLY: You never rewrite sentences, never draft replacement text, and never generate essay prose for the applicant. Every suggestion must name the problem in the applicant's own draft, never write the fix for them. This is a compliance requirement, not a style preference.

Score each dimension below from 1-5 using the stated anchors. For every dimension scored 3 or below, include exactly one interviewer-style challenge question probing that weakness. For every evidenceQuotes entry, quote the applicant's own words verbatim — never paraphrase.

Dimensions to score:
${dimensionBlock}
${activitiesBlock}${missionBlock}
Also check for these red flags:
${redFlagBlock}
For each one you find, always give a short "note" explaining what was flagged and why. For cliche_opening_or_closing and professionalism_issue, also quote the triggering essay text verbatim in evidenceQuote. For unexplained_gap, quote the essay verbatim in evidenceQuote when the essay itself raises the gap; if the gap only shows up by comparing the essay against the stored activities/profile (nothing in the essay text to quote), leave evidenceQuote null. Return an empty redFlags array if none apply.

Also flag any consistency issues between what the essay claims and the stored activities (if provided), name 3 strengths, name 3 priority fixes (naming the problem only, never writing the fix), and give one adcom-style verdict line.

APPLICANT'S ESSAY DRAFT:
${input.essay}`
}

export const CRITIQUE_TOOL_NAME = 'critique_essay'

function buildCritiqueTool(includeMissionFit: boolean): Anthropic.Tool {
  const dimensionKeys = getRubricDimensions(includeMissionFit).map(d => d.key)
  return {
    name: CRITIQUE_TOOL_NAME,
    description: 'Return a structured committee-simulator critique of a personal statement draft. Critique only — never include rewritten essay text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        dimensionScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string', enum: dimensionKeys },
              score: { type: 'integer', minimum: 1, maximum: 5 },
              evidenceQuotes: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3, description: 'Verbatim quotes from the essay, never paraphrased.' },
              challengeQuestion: { type: ['string', 'null'], description: 'Required (non-null) when score <= 3; null when score >= 4.' },
            },
            required: ['dimension', 'score', 'evidenceQuotes', 'challengeQuestion'],
          },
        },
        strengths: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
        priorityFixes: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3, description: 'Name the problem only — never write the replacement text.' },
        verdict: { type: 'string', description: 'One adcom-style verdict line.' },
        consistencyFlags: { type: 'array', items: { type: 'string' }, description: 'Essay claims not supported by the stored activity list. Empty array if none or no activities were provided.' },
        redFlags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', enum: [...RED_FLAG_KEYS] },
              note: { type: 'string', description: 'Short plain-language explanation of what was flagged and why. Always required.' },
              evidenceQuote: { type: ['string', 'null'], description: 'Verbatim essay quote. Required for cliche_opening_or_closing and professionalism_issue; may be null for unexplained_gap when the gap is only visible against stored activities/profile data.' },
            },
            required: ['key', 'note', 'evidenceQuote'],
          },
          description: 'Empty array if no red flags apply.',
        },
      },
      required: ['dimensionScores', 'strengths', 'priorityFixes', 'verdict', 'consistencyFlags', 'redFlags'],
    },
  }
}

/** Rough chars/4 heuristic for a pre-flight cost estimate — same convention as school-stats-extraction.ts's estimateTokens, not billing-accurate. */
export function estimateReviewTokens(input: ReviewPromptInput): number {
  return Math.ceil(buildReviewPrompt(input).length / 4)
}

export type ReviewResult = { review: EssayReview; usage: { input_tokens: number; output_tokens: number } }

/** Calls the model once with the critique tool forced, validates the structured output, and applies the prose-strip guard. */
export async function reviewEssay(anthropic: Anthropic, model: string, input: ReviewPromptInput): Promise<ReviewResult> {
  const tool = buildCritiqueTool(Boolean(input.school))
  const response = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    messages: [{ role: 'user', content: buildReviewPrompt(input) }],
    tools: [tool],
    tool_choice: { type: 'tool', name: CRITIQUE_TOOL_NAME },
  })

  const block = response.content.find((b: { type: string }) => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('No tool_use block in response')

  const review = applyProseGuard(EssayReviewSchema.parse(block.input))
  return { review, usage: response.usage }
}

import { z } from 'zod'

// Personal statement rubric for the Committee Simulator. Grounded in:
//  - AAMC "Core Competencies for Entering Medical Students" (2023) — the
//    Interpersonal, Intrapersonal, and Thinking & Reasoning domains adcoms
//    are trained to screen essays against.
//  - AAMC's official AMCAS Work & Activities / Personal Comments guidance —
//    the "show, don't tell" and reflection-over-recitation standard adcoms
//    are instructed to reward, and the red flags (cliche, unprofessionalism,
//    unexplained gaps) they're instructed to watch for.
// This file expresses that published guidance as scorable dimensions; it
// does not reproduce AAMC's text verbatim.

export const RUBRIC_DIMENSION_KEYS = [
  'theme_coherence',
  'clinical_motivation_shown_not_told',
  'narrative_arc',
  'specificity_evidence',
  'reflection_depth',
  'mission_fit',
] as const
export const RubricDimensionKeySchema = z.enum(RUBRIC_DIMENSION_KEYS)
export type RubricDimensionKey = z.infer<typeof RubricDimensionKeySchema>

export type RubricDimension = {
  key: RubricDimensionKey
  name: string
  description: string
  /** Only mission_fit is optional — it requires a target school's mission_keywords to score against. */
  optional: boolean
  adcomNotes: string
  /** Index 0 = anchor text for a score of 1, index 4 = anchor text for a score of 5. */
  anchors: [string, string, string, string, string]
}

export const RUBRIC_DIMENSIONS: Record<RubricDimensionKey, RubricDimension> = {
  theme_coherence: {
    key: 'theme_coherence',
    name: 'Theme Coherence',
    optional: false,
    description: 'Does the essay build around one throughline, or read as an unconnected list of achievements?',
    adcomNotes:
      'Adcoms read hundreds of essays a cycle; a single throughline is what makes an applicant legible and memorable against the Intrapersonal competency domain (self-reflection, capacity for improvement), rather than blending into a resume restated in prose.',
    anchors: [
      'No discernible theme — reads as a list of disconnected anecdotes.',
      'A theme is stated but dropped for most of the essay.',
      'A theme is present and loosely connects most paragraphs.',
      'A clear theme organizes the whole essay with only minor drift.',
      'One throughline organizes every paragraph, with the opening and closing bookending it.',
    ],
  },
  clinical_motivation_shown_not_told: {
    key: 'clinical_motivation_shown_not_told',
    name: 'Clinical Motivation — Shown, Not Told',
    optional: false,
    description: 'Is the applicant\'s motivation for medicine demonstrated through a specific scene, or asserted as a claim ("I want to help people")?',
    adcomNotes:
      'AAMC guidance explicitly instructs applicants to demonstrate motivation through concrete experience rather than declare it; adcoms are trained to discount unsupported motivational claims and reward a single well-chosen scene that shows the applicant reasoning through a clinical moment.',
    anchors: [
      'Motivation is only ever asserted ("I have always wanted to help people"), never shown.',
      'One brief scene gestures at motivation but is not developed enough to demonstrate it.',
      'At least one scene shows motivation, though the essay still leans on assertion elsewhere.',
      'Motivation is consistently shown through specific scenes with minimal reliance on assertion.',
      'Motivation is demonstrated entirely through vivid, specific scenes — no unsupported claims.',
    ],
  },
  narrative_arc: {
    key: 'narrative_arc',
    name: 'Narrative Arc',
    optional: false,
    description: 'Does the essay move somewhere — a change in understanding, plan, or self — or does it stay flat?',
    adcomNotes:
      'The Thinking & Reasoning competency domain rewards evidence of growth over time, not a static resume; an essay with no arc reads as a list of credentials rather than a person who has changed through experience.',
    anchors: [
      'No arc — the essay is a flat list of activities with no before/after.',
      'A change is asserted ("this changed me") but not demonstrated through contrast.',
      'A change is shown in one section but the essay does not carry it to a conclusion.',
      'A clear before/after arc runs through most of the essay.',
      'A well-developed arc carries from opening through a specific turning point to a resolved, forward-looking close.',
    ],
  },
  specificity_evidence: {
    key: 'specificity_evidence',
    name: 'Specificity & Evidence',
    optional: false,
    description: 'Are claims backed by concrete, checkable detail (a patient interaction, a specific task, a number), or left as generalities?',
    adcomNotes:
      'Vague claims ("I learned a lot", "it was a rewarding experience") are the single most common weakness adcoms report seeing; specificity is evidence the applicant actually had the experience they describe and reflected on it, not that they wrote a generic essay that could apply to anyone.',
    anchors: [
      'Almost entirely generic claims with no checkable detail.',
      'Occasional specific detail, but most claims are generic.',
      'A mix of specific and generic — roughly half the essay is checkable detail.',
      'Most claims are backed by specific, checkable detail.',
      'Nearly every claim is grounded in a specific, vivid, checkable detail.',
    ],
  },
  reflection_depth: {
    key: 'reflection_depth',
    name: 'Reflection Depth',
    optional: false,
    description: 'Does the essay explain what an experience meant and how it changed the applicant\'s thinking, or just recount what happened?',
    adcomNotes:
      'This mirrors the AMCAS Work & Activities "Most Meaningful" guidance directly: recounting what happened is description, not reflection; adcoms are trained to weight the "why it mattered" sentences far more than the narrative events themselves.',
    anchors: [
      'Pure recounting — what happened, with no reflection on why it mattered.',
      'A single generic reflective sentence tacked onto otherwise pure recounting.',
      'Some real reflection, but description still dominates the word count.',
      'Reflection is substantial and specific, though a few passages still just recount events.',
      'Every anecdote is paired with specific, non-generic reflection on what it changed in the applicant\'s thinking.',
    ],
  },
  mission_fit: {
    key: 'mission_fit',
    name: 'Mission Fit',
    optional: true,
    description: 'Do the essay\'s themes align with the target school\'s stated mission (e.g. primary care, underserved populations, research), scored against that school\'s mission_keywords.',
    adcomNotes:
      'Only scorable against a named school — schools screen for demonstrated (not asserted) alignment with their specific mission, and a strong essay for one school\'s mission can be a weak fit for another\'s.',
    anchors: [
      'Nothing in the essay connects to the school\'s stated mission themes.',
      'A surface-level or asserted connection to one mission theme.',
      'One mission theme is genuinely supported by essay content.',
      'Multiple mission themes are genuinely supported by essay content.',
      'The essay\'s central throughline directly and substantively matches the school\'s mission themes.',
    ],
  },
}

/** Returns the dimensions to score for a given review — all six when a target school is set, five (excluding mission_fit) otherwise. */
export function getRubricDimensions(includeMissionFit: boolean): RubricDimension[] {
  return RUBRIC_DIMENSION_KEYS.map(k => RUBRIC_DIMENSIONS[k]).filter(d => includeMissionFit || !d.optional)
}

export const RED_FLAG_KEYS = ['cliche_opening_or_closing', 'unexplained_gap', 'professionalism_issue'] as const
export const RedFlagKeySchema = z.enum(RED_FLAG_KEYS)
export type RedFlagKey = z.infer<typeof RedFlagKeySchema>

export type RedFlag = { key: RedFlagKey; name: string; description: string }

export const RED_FLAGS: Record<RedFlagKey, RedFlag> = {
  cliche_opening_or_closing: {
    key: 'cliche_opening_or_closing',
    name: 'Cliche opening or closing',
    description:
      'A stock opener/closer adcoms report seeing hundreds of times a cycle — a stethoscope-around-the-neck moment, "ever since I was young", a dictionary definition of a word like "empathy", or a generic "I want to help people" closing line.',
  },
  unexplained_gap: {
    key: 'unexplained_gap',
    name: 'Unexplained gap',
    description: 'A gap in timeline, GPA trend, or activity history that the essay raises (or that the profile shows) but never addresses.',
  },
  professionalism_issue: {
    key: 'professionalism_issue',
    name: 'Professionalism issue',
    description:
      'Content an adcom would flag on professionalism grounds: identifying or disparaging a specific patient, disparaging a named supervisor or institution, boundary violations, or similar.',
  },
}

export const RUBRIC_VERSION = 'v1'

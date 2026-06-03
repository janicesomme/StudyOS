import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT =
  'You are a Pattern-First exam question designer for struggling organic chemistry students.\n\n' +

  'YOUR ONE JOB: Write questions a struggling student can answer mechanically under exam pressure.\n\n' +

  'THE FIVE LAWS — violating any one of these makes the question useless:\n\n' +

  '1. VISIBLE TRIGGERS ONLY\n' +
  '   student_visible_trigger must describe something the student can literally see on the page.\n' +
  '   BAD: "a resonance-stabilized conjugate base"\n' +
  '   GOOD: "a double bond on the atom next to the one losing H"\n\n' +

  '2. MECHANICAL STEPS ONLY\n' +
  '   what_student_does must be numbered mechanical steps. No explanation. No theory.\n' +
  '   BAD: "Use electronegativity to determine which compound is more acidic"\n' +
  '   GOOD: "1. Remove the acidic H. 2. See which atom now holds the negative charge. 3. Find which is further right on the periodic table. 4. Further right = stronger acid."\n\n' +

  '3. FAILURE MODE IN STRUGGLE_POINT — NOT a concept gap\n' +
  '   BAD: "Student doesn\'t know pKa."\n' +
  '   GOOD: "Student knows the rule but second-guesses under pressure, especially when Ka notation is used where the direction of \'larger\' is not obvious."\n\n' +

  '4. TRANSLATE EVERY OCHEM TERM INLINE ON FIRST USE\n' +
  '   Every organic chemistry term must be followed immediately by a plain-English translation in parentheses.\n' +
  '   BAD: "the conjugate base is stabilized by resonance"\n' +
  '   GOOD: "the leftover piece after H leaves (conjugate base) has its charge spread over two atoms (resonance)"\n\n' +

  '5. JANICE SHORTCUT = MENTAL STICKY NOTE\n' +
  '   One sentence. Two maximum. If a student cannot recall it under exam pressure, it is too long.\n' +
  '   BAD: "To determine acid strength, consider the stability of the conjugate base by examining resonance delocalization, electronegativity, and inductive effects."\n' +
  '   GOOD: "Remove the H. Whichever atom better handles the negative charge left behind = stronger acid."'

function buildPrompt(chapterTitle: string, imageTopicLabels: string[] = [], generateQuestions = false): string {
  const hasFloor = imageTopicLabels.length > 0

  const floorSection = hasFloor
    ? '\nEXAM FLOOR — topics your real exams test for this course:\n' +
      imageTopicLabels.map(l => `  - ${l}`).join('\n') + '\n\n' +
      'Identify which of these this chapter teaches. Those are your floor concepts — ' +
      'plain_english MUST explicitly explain every one of them. Never drop a floor concept.\n\n' +
      'floor_covered: List every floor concept from the above list that you explicitly ' +
      'addressed in plain_english. After writing plain_english, verify every floor concept ' +
      'appears in it — if any are missing, expand plain_english before returning.\n\n' +
      'topic_tags: Same as floor_covered — the floor concepts you covered in this chapter.\n'
    : '\nfloor_covered: [] (no exam data yet)\ntopic_tags: [] (no exam data yet)\n'

  const baseShape = generateQuestions
    ? '{\n  "concepts": string[],\n  "plain_english": string,\n  "floor_covered": string[],\n  "topic_tags": string[],\n  "questions": Question[]\n}\n\n'
    : '{\n  "concepts": string[],\n  "plain_english": string,\n  "floor_covered": string[],\n  "topic_tags": string[]\n}\n\n'

  const conceptsInstruction = hasFloor
    ? 'concepts: All floor concepts this chapter covers, plus any prerequisite concepts ' +
      'needed to understand them. No arbitrary cap — include everything needed to answer the exam.\n'
    : 'concepts: Key concepts from this chapter as concise noun phrases.\n'

  const plainEnglishInstruction = hasFloor
    ? 'plain_english: A plain-English translation of this chapter. MANDATORY: cover every ' +
      'floor concept explicitly — if a floor concept is not explained, this translation fails. ' +
      'Voice: Klein "As a Second Language" — keep the mechanism, never dumb it down. ' +
      'Every technical term translated in parentheses on first use. ' +
      'Length: as long as needed to cover all floor concepts; no longer than what\'s needed ' +
      'to answer the exam.\n'
    : 'plain_english: A plain-English student-friendly translation of the core ideas. ' +
      'Voice: Klein "As a Second Language" — keep the mechanism, never dumb it down. ' +
      'Every technical term translated in parentheses on first use.\n'

  const questionSection = generateQuestions
    ? 'questions: 8-15 exam-prep questions. Each question MUST have ALL fields below.\n\n' +
      'Question fields:\n' +
      `- q_id: string  ("Q1", "Q2", ...)\n` +
      `- source_doc: string  (use "${chapterTitle}")\n` +
      '- source_page: string | null\n' +
      '- question_type: string  (exam instruction: "Identify the stronger acid", "Predict the product", "Draw the curved arrows")\n' +
      '- pack: string | null\n' +
      '- pattern: string | null  (e.g. "P1", "P4")\n' +
      '- difficulty: "E" | "P+" | "INT" | "ADV"\n' +
      '- suitable_use: string | null\n' +
      '- janice_shortcut: string  REQUIRED\n' +
      '- student_visible_trigger: string  REQUIRED\n' +
      '- what_student_does: string  REQUIRED\n' +
      '- struggle_point: string  REQUIRED\n' +
      '- why_easy_in_system: string  REQUIRED\n' +
      '- pre_lesson_needed: string | null\n' +
      '- topics: string[]\n' +
      '- reagents_involved: string[]\n' +
      '- vocab_needed: string[]\n\n' +
      'HARD RULES:\n' +
      '1. student_visible_trigger: must start with "Look for" or "You will see".\n' +
      '2. what_student_does: numbered mechanical steps only.\n' +
      '3. janice_shortcut: 1-2 sentences MAX.\n' +
      '4. struggle_point: describe the failure mode, not the missing concept.\n' +
      '5. Every ochem term must be translated inline in parentheses on first use.\n' +
      '6. Each question tests exactly ONE visible pattern.\n\n'
    : ''

  return (
    'Translate this chapter into study materials.\n\n' +
    'Return ONLY a valid JSON object. No markdown, no code fences, no explanation.\n\n' +
    baseShape +
    floorSection + '\n' +
    conceptsInstruction +
    plainEnglishInstruction +
    questionSection
  )
}

interface RawQuestion {
  q_id?: unknown
  source_doc?: unknown
  source_page?: unknown
  question_type?: unknown
  pack?: unknown
  pattern?: unknown
  difficulty?: unknown
  suitable_use?: unknown
  janice_shortcut?: unknown
  student_visible_trigger?: unknown
  what_student_does?: unknown
  struggle_point?: unknown
  why_easy_in_system?: unknown
  pre_lesson_needed?: unknown
  topics?: unknown
  reagents_involved?: unknown
  vocab_needed?: unknown
}

function toStr(val: unknown): string | null {
  return typeof val === 'string' && val.trim() ? val.trim() : null
}

function toStrReq(val: unknown): string | null {
  return toStr(val)
}

function toStrArr(val: unknown): string[] {
  return Array.isArray(val)
    ? (val as unknown[]).filter((x): x is string => typeof x === 'string')
    : []
}

const VALID_DIFFICULTIES = new Set(['E', 'P+', 'INT', 'ADV'])

function validateQuestion(raw: RawQuestion): object | null {
  const qId = toStr(raw.q_id)
  const sourceDoc = toStr(raw.source_doc)
  const questionType = toStr(raw.question_type)
  const difficulty = toStr(raw.difficulty)
  const janiceShortcut = toStrReq(raw.janice_shortcut)
  const trigger = toStrReq(raw.student_visible_trigger)
  const whatToDo = toStrReq(raw.what_student_does)
  const struggle = toStrReq(raw.struggle_point)
  const whyEasy = toStrReq(raw.why_easy_in_system)

  if (!qId || !sourceDoc || !questionType || !difficulty) return null
  if (!janiceShortcut || !trigger || !whatToDo || !struggle || !whyEasy) return null
  if (!VALID_DIFFICULTIES.has(difficulty)) return null

  return {
    q_id: qId,
    source_doc: sourceDoc,
    source_page: toStr(raw.source_page),
    question_type: questionType,
    pack: toStr(raw.pack),
    pattern: toStr(raw.pattern),
    difficulty,
    suitable_use: toStr(raw.suitable_use),
    janice_shortcut: janiceShortcut,
    student_visible_trigger: trigger,
    what_student_does: whatToDo,
    struggle_point: struggle,
    why_easy_in_system: whyEasy,
    pre_lesson_needed: toStr(raw.pre_lesson_needed),
    topics: toStrArr(raw.topics),
    reagents_involved: toStrArr(raw.reagents_involved),
    vocab_needed: toStrArr(raw.vocab_needed),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const body = await req.json() as { chapter_text?: unknown; course_id?: unknown; chapter_title?: unknown }
    const chapterText = typeof body.chapter_text === 'string' ? body.chapter_text.trim() : ''
    const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : ''
    const chapterTitle = typeof body.chapter_title === 'string' ? body.chapter_title.trim() : 'Chapter'

    if (!chapterText || !courseId) {
      return new Response('Missing chapter_text or course_id', { status: 400, headers: corsHeaders })
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('student_id, question_source')
      .eq('id', courseId)
      .single()

    if (courseError || !course || course.student_id !== user.id) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    const questionSource = (course as { student_id: string; question_source: string }).question_source ?? 'generated'

    // Fetch existing image question topic labels for this course (for chapter matching)
    const { data: topicRows } = await supabaseAdmin
      .from('exam_questions')
      .select('question_type')
      .eq('course_id', courseId)
      .eq('student_id', user.id)
      .eq('verified', true)
      .not('image_url', 'is', null)

    const imageTopicLabels: string[] = topicRows
      ? [...new Set((topicRows as { question_type: string }[]).map(r => r.question_type).filter(Boolean))]
      : []

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    let claudeResponse: Anthropic.Message
    try {
      claudeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `${buildPrompt(chapterTitle, imageTopicLabels, questionSource === 'generated')}\n\n---\n\n${chapterText}`,
        }],
      })
    } catch (err) {
      return new Response(`Claude API error: ${String(err)}`, { status: 502, headers: corsHeaders })
    }

    const responseText =
      claudeResponse.content[0]?.type === 'text' ? claudeResponse.content[0].text : ''

    const objStart = responseText.indexOf('{')
    const objEnd = responseText.lastIndexOf('}')
    const stripped = objStart !== -1 && objEnd > objStart
      ? responseText.slice(objStart, objEnd + 1)
      : responseText.trim()

    let parsed: { concepts?: unknown; plain_english?: unknown; floor_covered?: unknown; questions?: unknown; topic_tags?: unknown }
    try {
      parsed = JSON.parse(stripped) as typeof parsed
    } catch {
      return new Response('Claude response was not valid JSON', { status: 500, headers: corsHeaders })
    }

    const concepts = Array.isArray(parsed.concepts)
      ? (parsed.concepts as unknown[]).filter((c): c is string => typeof c === 'string')
      : []

    const plainEnglish = typeof parsed.plain_english === 'string' ? parsed.plain_english.trim() : ''

    const floorCovered = Array.isArray(parsed.floor_covered)
      ? (parsed.floor_covered as unknown[]).filter((f): f is string => typeof f === 'string')
      : []

    const topicTags = Array.isArray(parsed.topic_tags)
      ? (parsed.topic_tags as unknown[]).filter((t): t is string => typeof t === 'string')
      : []

    const responseBody: Record<string, unknown> = { concepts, plain_english: plainEnglish, floor_covered: floorCovered, topic_tags: topicTags }

    if (questionSource === 'generated') {
      const rawQuestions = Array.isArray(parsed.questions) ? (parsed.questions as RawQuestion[]) : []
      const validQuestions: object[] = []
      for (const raw of rawQuestions) {
        const v = validateQuestion(raw)
        if (v) validQuestions.push(v)
      }
      responseBody.questions = validQuestions
    }

    return new Response(
      JSON.stringify(responseBody),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(`Unexpected error: ${String(err)}`, { status: 500, headers: corsHeaders })
  }
})

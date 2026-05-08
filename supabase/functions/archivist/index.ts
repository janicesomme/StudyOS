import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function clampInt(val: unknown, min: number, max: number): number | null {
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  return Math.min(Math.max(Math.round(n), min), max)
}

function clampFloat(val: unknown, min: number, max: number): number | null {
  const n = Number(val)
  if (!Number.isFinite(n)) return null
  return Math.min(Math.max(n, min), max)
}

// deno-lint-ignore no-explicit-any
async function markFailed(db: any, id: string, message: string): Promise<void> {
  await db.from('source_materials').update({
    processing_status: 'failed',
    error_message: message,
  }).eq('id', id)
}

const SYSTEM_PROMPT =
  'You are the Archivist, a knowledge extraction specialist for an academic study system. ' +
  'Extract every discrete, testable concept from the provided material. ' +
  'Your output will be used to build study sessions, recall exercises, and exam prep.'

const EXTRACTION_PROMPT =
  'Extract all knowledge units from this academic material.\n\n' +
  'Return ONLY a valid JSON array. No other text, no markdown code fences, no explanation.\n' +
  'Each element must have exactly these fields:\n' +
  '- concept_name: string (short precise name)\n' +
  '- plain_english_explanation: string (clear 2-4 sentence explanation)\n' +
  '- topic: string (main topic area)\n' +
  '- subtopic: string | null\n' +
  '- difficulty_level: integer 1-5 (1=fundamental, 5=advanced)\n' +
  '- common_misconceptions: string[] (empty array if none)\n' +
  '- testability_score: integer 1-5 (1=unlikely, 5=almost certain)\n' +
  '- extraction_confidence: number 0.0-1.0\n' +
  '- source_location: string | null (page or section reference if visible)'

interface RawUnit {
  concept_name: unknown
  plain_english_explanation: unknown
  topic: unknown
  subtopic?: unknown
  difficulty_level?: unknown
  common_misconceptions?: unknown
  testability_score?: unknown
  extraction_confidence?: unknown
  source_location?: unknown
}

interface ValidatedUnit {
  student_id: string
  course_id: string
  source_material_id: string
  concept_name: string
  plain_english_explanation: string
  topic: string
  subtopic: string | null
  difficulty_level: number | null
  prerequisite_concept_ids: string[]
  common_misconceptions: string[]
  testability_score: number | null
  extraction_confidence: number | null
  source_location: string | null
  created_by_agent: string
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

    const body = await req.json()
    const { source_material_id } = body as { source_material_id?: string }
    if (!source_material_id || typeof source_material_id !== 'string') {
      return new Response('Missing source_material_id', { status: 400, headers: corsHeaders })
    }

    // Fetch material -- must belong to authenticated user
    const { data: material, error: materialError } = await supabaseAdmin
      .from('source_materials')
      .select('*')
      .eq('id', source_material_id)
      .eq('student_id', user.id)
      .single()

    if (materialError || !material) {
      return new Response('Material not found', { status: 404, headers: corsHeaders })
    }

    // Verify related course also belongs to the same user
    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('student_id')
      .eq('id', material.course_id)
      .single()

    if (courseError || !course || course.student_id !== user.id) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders })
    }

    // Skip if already processed
    if (material.processing_status === 'complete') {
      return new Response(
        JSON.stringify({ success: true, count: 0, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin
      .from('source_materials')
      .update({ processing_status: 'processing', error_message: null })
      .eq('id', source_material_id)

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('course-materials')
      .download(material.file_url)

    if (downloadError || !fileData) {
      await markFailed(supabaseAdmin, source_material_id, 'Failed to download file from storage')
      return new Response('Download failed', { status: 500, headers: corsHeaders })
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

    // TXT: primary supported path. PDF: experimental.
    let messageContent: Anthropic.MessageParam['content']

    if (material.file_type === 'txt') {
      const text = await fileData.text()
      if (!text.trim()) {
        await markFailed(supabaseAdmin, source_material_id, 'File is empty')
        return new Response('Empty file', { status: 400, headers: corsHeaders })
      }
      messageContent = [{ type: 'text', text: `${EXTRACTION_PROMPT}\n\n---\n\n${text}` }]
    } else {
      // PDF -- experimental
      const buffer = await fileData.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      messageContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ]
    }

    let claudeResponse: Anthropic.Message
    try {
      claudeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }],
      })
    } catch (err) {
      await markFailed(supabaseAdmin, source_material_id, `Claude API error: ${String(err)}`)
      return new Response('Claude API call failed', { status: 502, headers: corsHeaders })
    }

    const responseText =
      claudeResponse.content[0]?.type === 'text' ? claudeResponse.content[0].text : ''

    const stripped = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim()

    let rawUnits: unknown
    try {
      rawUnits = JSON.parse(stripped)
    } catch {
      await markFailed(supabaseAdmin, source_material_id, 'Claude response was not valid JSON')
      return new Response('Parse error', { status: 500, headers: corsHeaders })
    }

    if (!Array.isArray(rawUnits)) {
      await markFailed(supabaseAdmin, source_material_id, 'Claude response was not a JSON array')
      return new Response('Unexpected response shape', { status: 500, headers: corsHeaders })
    }

    if (rawUnits.length === 0) {
      await supabaseAdmin.from('source_materials').update({
        processing_status: 'partial',
        extraction_confidence: null,
        needs_review: true,
        error_message: 'No knowledge units extracted',
      }).eq('id', source_material_id)
      return new Response(
        JSON.stringify({ success: true, count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const validUnits: ValidatedUnit[] = []
    let skippedCount = 0

    for (const raw of rawUnits as RawUnit[]) {
      const conceptName = typeof raw.concept_name === 'string' ? raw.concept_name.trim() : ''
      const explanation =
        typeof raw.plain_english_explanation === 'string'
          ? raw.plain_english_explanation.trim()
          : ''
      const topic = typeof raw.topic === 'string' ? raw.topic.trim() : ''

      if (!conceptName || !explanation || !topic) {
        skippedCount++
        continue
      }

      const misconceptions = Array.isArray(raw.common_misconceptions)
        ? (raw.common_misconceptions as unknown[]).filter((m): m is string => typeof m === 'string')
        : []

      validUnits.push({
        student_id: user.id,
        course_id: material.course_id,
        source_material_id: material.id,
        concept_name: conceptName,
        plain_english_explanation: explanation,
        topic,
        subtopic: typeof raw.subtopic === 'string' ? raw.subtopic.trim() : null,
        difficulty_level: clampInt(raw.difficulty_level, 1, 5),
        prerequisite_concept_ids: [],
        common_misconceptions: misconceptions,
        testability_score: clampInt(raw.testability_score, 1, 5),
        extraction_confidence: clampFloat(raw.extraction_confidence, 0, 1),
        source_location: typeof raw.source_location === 'string' ? raw.source_location.trim() : null,
        created_by_agent: 'archivist',
      })
    }

    if (validUnits.length === 0) {
      await markFailed(
        supabaseAdmin,
        source_material_id,
        `All ${rawUnits.length} extracted units failed validation`
      )
      return new Response('No valid units', { status: 500, headers: corsHeaders })
    }

    const { error: insertError } = await supabaseAdmin.from('knowledge_units').insert(validUnits)

    if (insertError) {
      await markFailed(supabaseAdmin, source_material_id, `DB insert error: ${insertError.message}`)
      return new Response('Insert failed', { status: 500, headers: corsHeaders })
    }

    // Safe: validUnits.length > 0 verified above
    const avgConfidence =
      validUnits.reduce((sum, ku) => sum + (ku.extraction_confidence ?? 0.8), 0) / validUnits.length

    const processingStatus = skippedCount > 0 ? 'partial' : 'complete'

    await supabaseAdmin.from('source_materials').update({
      processing_status: processingStatus,
      extraction_confidence: avgConfidence,
      needs_review: avgConfidence < 0.7 || skippedCount > 0,
      error_message: skippedCount > 0
        ? `${skippedCount} unit(s) skipped due to missing required fields`
        : null,
    }).eq('id', source_material_id)

    return new Response(
      JSON.stringify({ success: true, count: validUnits.length, skipped: skippedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(`Unexpected error: ${String(err)}`, { status: 500, headers: corsHeaders })
  }
})

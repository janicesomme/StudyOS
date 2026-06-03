/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const STUDENT_ID = process.env.STUDENT_ID;
const COURSE_ID = process.env.COURSE_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY || !STUDENT_ID || !COURSE_ID) {
  console.error('Missing env vars. Required in .env.local:');
  console.error('  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, STUDENT_ID, COURSE_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT =
  'Extract every discrete, testable concept from this organic chemistry textbook chapter.\n\n' +
  'Return ONLY a valid JSON array. No markdown, no explanation, no code fences.\n' +
  'Each element must have exactly these fields:\n' +
  '- concept_name: string (short, precise name for the concept)\n' +
  '- plain_english_explanation: string (clear 2-4 sentence explanation a struggling student can understand)\n' +
  '- topic: string (main topic area, e.g. "Bonding", "Acid-Base", "Stereochemistry")\n' +
  '- subtopic: string | null\n' +
  '- difficulty_level: integer 1-5 (1=fundamental, 5=advanced)\n' +
  '- common_misconceptions: string[] (empty array if none)\n' +
  '- testability_score: integer 1-5 (1=unlikely on exam, 5=almost certain)\n' +
  '- extraction_confidence: number 0.0-1.0\n' +
  '- source_location: string | null (page or section reference if visible)\n\n' +
  'Extract every concept. Do not summarise or skip any.';

interface RawUnit {
  concept_name?: unknown;
  plain_english_explanation?: unknown;
  topic?: unknown;
  subtopic?: unknown;
  difficulty_level?: unknown;
  common_misconceptions?: unknown;
  testability_score?: unknown;
  extraction_confidence?: unknown;
  source_location?: unknown;
}

function clampInt(val: unknown, min: number, max: number): number | null {
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(Math.round(n), min), max);
}

function clampFloat(val: unknown, min: number, max: number): number | null {
  const n = Number(val);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(n, min), max);
}

async function resetStuckMaterials(title: string): Promise<void> {
  const { data } = await supabase
    .from('source_materials')
    .select('id, processing_status')
    .eq('student_id', STUDENT_ID!)
    .eq('course_id', COURSE_ID!)
    .eq('title', title);

  if (!data || data.length === 0) return;

  for (const row of data) {
    if (row.processing_status === 'processing' || row.processing_status === 'pending') {
      await supabase
        .from('source_materials')
        .update({ processing_status: 'failed', error_message: 'Reset by local ingest script' })
        .eq('id', row.id);
      console.log(`Reset stuck record: ${row.id}`);
    }
  }
}

async function ingestChapter(pdfPath: string, title: string): Promise<void> {
  const absPath = path.resolve(pdfPath);
  if (!fs.existsSync(absPath)) throw new Error(`PDF not found: ${absPath}`);

  console.log(`\nIngesting: ${title}`);
  console.log(`File: ${absPath}`);

  // Reset any stuck records with this title
  await resetStuckMaterials(title);

  // Create source_material record
  const filename = path.basename(absPath);
  const filePath = `${STUDENT_ID}/${COURSE_ID}/${Date.now()}-${filename}`;

  console.log('Uploading to Supabase Storage...');
  const fileBuffer = fs.readFileSync(absPath);
  const { error: uploadError } = await supabase.storage
    .from('course-materials')
    .upload(filePath, fileBuffer, { contentType: 'application/pdf' });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  const { data: material, error: insertError } = await (supabase.from('source_materials') as any)
    .insert({
      student_id: STUDENT_ID,
      course_id: COURSE_ID,
      title,
      file_type: 'pdf',
      file_url: filePath,
      processing_status: 'processing',
    })
    .select()
    .single();

  if (insertError || !material) {
    throw new Error(`source_materials insert failed: ${insertError?.message ?? 'unknown'}`);
  }

  console.log(`Source material created: ${material.id}`);

  // Send to Claude with streaming (no timeout risk)
  const base64 = fileBuffer.toString('base64');
  console.log('Sending to Claude Opus for extraction (may take 60-120s)...');

  const message = await anthropic.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 32000,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: EXTRACTION_PROMPT },
      ],
    }],
  }).finalMessage();

  const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const arrayStart = responseText.indexOf('[');
  const arrayEnd = responseText.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd <= arrayStart) {
    await supabase.from('source_materials')
      .update({ processing_status: 'failed', error_message: 'Claude did not return a JSON array' })
      .eq('id', material.id);
    throw new Error(`Claude did not return a JSON array.\nPreview: ${responseText.slice(0, 300)}`);
  }

  let rawUnits: unknown[];
  try {
    rawUnits = JSON.parse(responseText.slice(arrayStart, arrayEnd + 1)) as unknown[];
  } catch {
    await supabase.from('source_materials')
      .update({ processing_status: 'failed', error_message: 'JSON parse failed' })
      .eq('id', material.id);
    throw new Error(`JSON parse failed.\nPreview: ${responseText.slice(arrayStart, arrayStart + 300)}`);
  }

  console.log(`Claude returned ${rawUnits.length} raw units.`);

  const validUnits = [];
  let skipped = 0;

  for (const raw of rawUnits as RawUnit[]) {
    const conceptName = typeof raw.concept_name === 'string' ? raw.concept_name.trim() : '';
    const explanation = typeof raw.plain_english_explanation === 'string' ? raw.plain_english_explanation.trim() : '';
    const topic = typeof raw.topic === 'string' ? raw.topic.trim() : '';

    if (!conceptName || !explanation || !topic) { skipped++; continue; }

    const misconceptions = Array.isArray(raw.common_misconceptions)
      ? (raw.common_misconceptions as unknown[]).filter((m): m is string => typeof m === 'string')
      : [];

    validUnits.push({
      student_id: STUDENT_ID,
      course_id: COURSE_ID,
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
    });
  }

  console.log(`Validated: ${validUnits.length}  |  skipped: ${skipped}`);

  if (validUnits.length === 0) {
    await supabase.from('source_materials')
      .update({ processing_status: 'failed', error_message: 'No valid units after validation' })
      .eq('id', material.id);
    throw new Error('No valid knowledge units — aborting.');
  }

  const { error: kuError } = await supabase.from('knowledge_units').insert(validUnits);
  if (kuError) {
    await supabase.from('source_materials')
      .update({ processing_status: 'failed', error_message: `Insert failed: ${kuError.message}` })
      .eq('id', material.id);
    throw new Error(`knowledge_units insert failed: ${kuError.message}`);
  }

  const avgConfidence = validUnits.reduce((s, u) => s + (u.extraction_confidence ?? 0.8), 0) / validUnits.length;

  await supabase.from('source_materials').update({
    processing_status: skipped > 0 ? 'partial' : 'complete',
    extraction_confidence: avgConfidence,
    needs_review: avgConfidence < 0.7 || skipped > 0,
    error_message: skipped > 0 ? `${skipped} unit(s) skipped` : null,
  }).eq('id', material.id);

  console.log(`\nDone. ${validUnits.length} knowledge units inserted.`);
  console.log(`Status: ${skipped > 0 ? 'partial' : 'complete'}`);
}

const [, , pdfPath, titleArg] = process.argv;
if (!pdfPath) {
  console.error('Usage: npm run ingest-chapter -- "<pdf-path>" "<title>"');
  console.error('Example: npm run ingest-chapter -- "C:/path/to/ch1.pdf" "Klein Chapter 1"');
  process.exit(1);
}

const title = titleArg ?? path.basename(pdfPath, path.extname(pdfPath));

ingestChapter(pdfPath, title).catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

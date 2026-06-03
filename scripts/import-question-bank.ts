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
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, STUDENT_ID, COURSE_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT =
  'Extract every exam question from this question bank markdown file.\n\n' +
  'Return ONLY a valid JSON array. No markdown, no explanation, no code fences.\n' +
  'Each element must have exactly these fields:\n' +
  '- q_id: string  (e.g. "Q1", "Q17")\n' +
  '- source_doc: string  (the source PDF filename from the file header)\n' +
  '- source_page: string | null  (page reference, e.g. "4-5")\n' +
  '- question_type: string  (description of what the question asks)\n' +
  '- pack: string | null  (e.g. "Pack 1", "Pack 1 + 2")\n' +
  '- pattern: string | null  (e.g. "P1", "P4, P5")\n' +
  '- difficulty: string  (exactly one of: "E", "P+", "INT", "ADV")\n' +
  '- suitable_use: string | null  (e.g. "Automaticity mission", "Mixed worksheet")\n' +
  '- janice_shortcut: string | null  (the one or two sentence shortcut from the card)\n' +
  '- student_visible_trigger: string | null  (what the student sees that triggers the pattern)\n' +
  '- what_student_does: string | null  (step-by-step description of the mechanical move)\n' +
  '- struggle_point: string | null  (what students typically get wrong)\n' +
  '- why_easy_in_system: string | null  (why this system makes the question tractable)\n' +
  '- pre_lesson_needed: string | null  (prerequisite patterns and packs)\n' +
  '- topics: string[]  (e.g. ["acid-base", "conjugate pairs"])\n' +
  '- reagents_involved: string[]  (reagent full names if any are named in the question)\n' +
  '- vocab_needed: string[]  (key vocab terms the student must know)\n\n' +
  'Extract every question from both Table A and Table B. Do not skip any.';

interface RawQuestion {
  q_id?: unknown;
  source_doc?: unknown;
  source_page?: unknown;
  question_type?: unknown;
  pack?: unknown;
  pattern?: unknown;
  difficulty?: unknown;
  suitable_use?: unknown;
  janice_shortcut?: unknown;
  student_visible_trigger?: unknown;
  what_student_does?: unknown;
  struggle_point?: unknown;
  why_easy_in_system?: unknown;
  pre_lesson_needed?: unknown;
  topics?: unknown;
  reagents_involved?: unknown;
  vocab_needed?: unknown;
}

function toStr(val: unknown): string | null {
  return typeof val === 'string' ? val.trim() || null : null;
}

function toStrArr(val: unknown): string[] {
  return Array.isArray(val)
    ? (val as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
}

const VALID_DIFFICULTIES = new Set(['E', 'P+', 'INT', 'ADV']);

function validateQuestion(raw: RawQuestion): object | null {
  const qId = toStr(raw.q_id);
  const questionType = toStr(raw.question_type);
  const sourceDoc = toStr(raw.source_doc);
  const difficulty = toStr(raw.difficulty);

  if (!qId || !questionType || !sourceDoc || !difficulty) return null;
  // Normalize mixed difficulty like "E-P+" to "P+" (the harder of the two)
  const normalizedDifficulty = difficulty.includes('-')
    ? difficulty.split('-').reduce((harder, d) => {
        const rank: Record<string, number> = { E: 0, 'P+': 1, INT: 2, ADV: 3 };
        return (rank[d.trim()] ?? 0) > (rank[harder] ?? 0) ? d.trim() : harder;
      }, 'E')
    : difficulty;
  if (!VALID_DIFFICULTIES.has(normalizedDifficulty)) return null;

  return {
    student_id: STUDENT_ID,
    course_id: COURSE_ID,
    q_id: qId,
    source_doc: sourceDoc,
    source_page: toStr(raw.source_page),
    question_type: questionType,
    pack: toStr(raw.pack),
    pattern: toStr(raw.pattern),
    difficulty: normalizedDifficulty,
    suitable_use: toStr(raw.suitable_use),
    janice_shortcut: toStr(raw.janice_shortcut),
    student_visible_trigger: toStr(raw.student_visible_trigger),
    what_student_does: toStr(raw.what_student_does),
    struggle_point: toStr(raw.struggle_point),
    why_easy_in_system: toStr(raw.why_easy_in_system),
    pre_lesson_needed: toStr(raw.pre_lesson_needed),
    topics: toStrArr(raw.topics),
    reagents_involved: toStrArr(raw.reagents_involved),
    vocab_needed: toStrArr(raw.vocab_needed),
    related_knowledge_unit_ids: [],
    verified: false,
  };
}

async function importFile(mdPath: string): Promise<void> {
  const content = fs.readFileSync(mdPath, 'utf8');
  const filename = path.basename(mdPath);

  console.log(`\nProcessing: ${filename}`);
  console.log(`Sending to Claude for extraction...`);

  const message = await anthropic.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 16000,
    messages: [{
      role: 'user',
      content: [{ type: 'text', text: `${EXTRACTION_PROMPT}\n\n---\n\n${content}` }],
    }],
  }).finalMessage();

  const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const arrayStart = responseText.indexOf('[');
  const arrayEnd = responseText.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd <= arrayStart) {
    throw new Error(`Claude did not return a JSON array for ${filename}`);
  }

  let rawArray: unknown[];
  try {
    rawArray = JSON.parse(responseText.slice(arrayStart, arrayEnd + 1)) as unknown[];
  } catch {
    throw new Error(`JSON parse failed for ${filename}`);
  }

  console.log(`Claude returned ${rawArray.length} raw entries.`);

  const valid: object[] = [];
  let skipped = 0;
  for (const raw of rawArray as RawQuestion[]) {
    const v = validateQuestion(raw);
    if (v) valid.push(v);
    else skipped++;
  }

  console.log(`Validated: ${valid.length}  |  skipped: ${skipped}`);
  if (valid.length === 0) {
    console.warn(`No valid questions found in ${filename} — skipping insert.`);
    return;
  }

  const { error } = await supabase.from('exam_questions').insert(valid);
  if (error) throw new Error(`Insert failed for ${filename}: ${error.message}`);

  console.log(`Inserted ${valid.length} questions from ${filename}.`);
}

async function run(): Promise<void> {
  const bankDir = path.join(__dirname, '..', 'question_bank_index_batches');
  const files = fs.readdirSync(bankDir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(bankDir, f));

  if (files.length === 0) {
    console.error('No markdown files found in question_bank_index_batches/');
    process.exit(1);
  }

  console.log(`Found ${files.length} file(s) to import.`);

  for (const file of files) {
    await importFile(file);
  }

  console.log('\nAll files imported.');
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

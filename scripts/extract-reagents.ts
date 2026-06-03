/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local manually — tsx does not forward --env-file to Node
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT =
  'Extract every reagent from this organic chemistry reagent guide.\n\n' +
  'Return ONLY a valid JSON array. No markdown, no explanation, no code fences.\n' +
  'Each element must have exactly these fields:\n' +
  '- abbreviation: string | null  (e.g. "NaBH4" — null if no common abbreviation)\n' +
  '- full_name: string  (e.g. "Sodium borohydride")\n' +
  '- smiles: string | null  (SMILES notation if you know it reliably; null otherwise)\n' +
  '- what_it_does: string  (plain English, 1-3 sentences — what transformation it performs)\n' +
  '- mechanism_type: string | null  (one of: "reduction", "oxidation", "substitution",\n' +
  '    "elimination", "addition", "protection", "deprotection", "coupling",\n' +
  '    "rearrangement", "other")\n' +
  '- reaction_types: string[]  (specific transformations, e.g. ["aldehyde to primary alcohol"])\n' +
  '- stereochemistry_notes: string | null  (e.g. "gives racemic mixture", "syn addition")\n' +
  '- conditions: string | null  (solvent, temperature, notable experimental notes)\n' +
  '- similar_reagents: string[]  (full names of reagents commonly confused with this one)\n' +
  '- pka_relevance: string | null  (only for acid/base reagents — pKa value or basicity notes)\n' +
  '- verified_source: string  (page reference, e.g. "Reagent Guide p.12")\n\n' +
  'Include every reagent. Do not summarise or skip any.';

interface RawReagent {
  abbreviation?: unknown;
  full_name?: unknown;
  smiles?: unknown;
  what_it_does?: unknown;
  mechanism_type?: unknown;
  reaction_types?: unknown;
  stereochemistry_notes?: unknown;
  conditions?: unknown;
  similar_reagents?: unknown;
  pka_relevance?: unknown;
  verified_source?: unknown;
}

interface ValidatedReagent {
  abbreviation: string | null;
  full_name: string;
  smiles: string | null;
  what_it_does: string;
  mechanism_type: string | null;
  reaction_types: string[];
  stereochemistry_notes: string | null;
  conditions: string | null;
  similar_reagents: string[];
  pka_relevance: string | null;
  verified_source: string;
}

function toStringArray(val: unknown): string[] {
  return Array.isArray(val)
    ? (val as unknown[]).filter((x): x is string => typeof x === 'string')
    : [];
}

function toNullableString(val: unknown): string | null {
  return typeof val === 'string' ? val.trim() || null : null;
}

function validateReagent(raw: RawReagent): ValidatedReagent | null {
  const fullName = typeof raw.full_name === 'string' ? raw.full_name.trim() : '';
  const whatItDoes = typeof raw.what_it_does === 'string' ? raw.what_it_does.trim() : '';
  const verifiedSource = typeof raw.verified_source === 'string' ? raw.verified_source.trim() : '';

  if (!fullName || !whatItDoes || !verifiedSource) return null;

  return {
    abbreviation: toNullableString(raw.abbreviation),
    full_name: fullName,
    smiles: toNullableString(raw.smiles),
    what_it_does: whatItDoes,
    mechanism_type: toNullableString(raw.mechanism_type),
    reaction_types: toStringArray(raw.reaction_types),
    stereochemistry_notes: toNullableString(raw.stereochemistry_notes),
    conditions: toNullableString(raw.conditions),
    similar_reagents: toStringArray(raw.similar_reagents),
    pka_relevance: toNullableString(raw.pka_relevance),
    verified_source: verifiedSource,
  };
}

async function extractReagents(pdfPath: string): Promise<void> {
  const absPath = path.resolve(pdfPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`PDF not found: ${absPath}`);
  }

  console.log(`Reading: ${absPath}`);
  const base64 = fs.readFileSync(absPath).toString('base64');

  console.log('Sending to Claude Opus for extraction (this takes ~60s)...');
  const message = await anthropic.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 32000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 },
        },
        { type: 'text', text: EXTRACTION_PROMPT },
      ],
    }],
  }).finalMessage();

  const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const arrayStart = responseText.indexOf('[');
  const arrayEnd = responseText.lastIndexOf(']');

  if (arrayStart === -1 || arrayEnd <= arrayStart) {
    throw new Error(`Claude did not return a JSON array.\nPreview: ${responseText.slice(0, 300)}`);
  }

  let rawArray: unknown[];
  try {
    rawArray = JSON.parse(responseText.slice(arrayStart, arrayEnd + 1)) as unknown[];
  } catch {
    throw new Error(`JSON parse failed.\nPreview: ${responseText.slice(arrayStart, arrayStart + 300)}`);
  }

  console.log(`Claude returned ${rawArray.length} raw entries.`);

  const valid: ValidatedReagent[] = [];
  let skipped = 0;
  for (const raw of rawArray as RawReagent[]) {
    const v = validateReagent(raw);
    if (v) valid.push(v);
    else skipped++;
  }

  console.log(`Validated: ${valid.length} reagents  |  skipped: ${skipped}`);
  if (skipped > 0) {
    console.log('Skipped entries were missing full_name, what_it_does, or verified_source.');
  }

  if (valid.length === 0) throw new Error('No valid reagents after validation — aborting insert.');

  const { error } = await supabase.from('reagents').insert(valid);
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);

  console.log(`Done. ${valid.length} reagents inserted into reagents table.`);
}

const [, , pdfPath] = process.argv;
if (!pdfPath) {
  console.error('Usage: npx tsx scripts/extract-reagents.ts <path-to-reagent-guide.pdf>');
  process.exit(1);
}

extractReagents(pdfPath).catch(err => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

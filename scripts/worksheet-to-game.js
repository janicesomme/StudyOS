#!/usr/bin/env node
/**
 * worksheet-to-game.js
 *
 * Factory boundary:
 *   MANUAL  : you fill in the CSV (one row per reaction) from your worksheet / scanned images
 *   AUTOMATED: this script reads the CSV and writes a playable content JS file
 *
 * Usage:
 *   node scripts/worksheet-to-game.js <input.csv> --subject "Alkene Additions" --out docs/games/alkene-arcade/content/alkenes.js
 *
 * Required CSV columns (order does not matter, header row required):
 *   id, name, reagents, tier, decision_q,
 *   choiceA, choiceA_correct, choiceB, choiceB_correct,
 *   choiceC, choiceC_correct, choiceD, choiceD_correct,
 *   prod_type, prod_c1, prod_c2, prod_stereo,
 *   rule, trap_id,
 *   firstMove, shortcut, whyTrapTempting, smiles
 *
 * tier values  : recognise | toggle | predict | reverse
 * prod_type    : add | diol | epoxide | alkane | cleave
 * prod_stereo  : syn | anti | (leave blank)
 * choiceX_correct: true | false (only one choice per row should be true)
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const USAGE = [
  'Usage: node scripts/worksheet-to-game.js <input.csv> --subject "Name" --out <output.js>',
  '',
  'Required CSV columns: id, name, reagents, tier, decision_q,',
  '  choiceA, choiceA_correct, choiceB, choiceB_correct,',
  '  choiceC, choiceC_correct, choiceD, choiceD_correct,',
  '  prod_type, prod_c1, prod_c2, prod_stereo,',
  '  rule, trap_id, firstMove, shortcut, whyTrapTempting, smiles',
].join('\n');

/* ---- arg parsing ---- */
function parseArgs() {
  const args = process.argv.slice(2);
  const input = args.find(a => !a.startsWith('--'));
  const subjectIdx = args.indexOf('--subject');
  const outIdx     = args.indexOf('--out');
  if (!input || subjectIdx === -1 || outIdx === -1) {
    console.error(USAGE);
    process.exit(1);
  }
  return { input, subject: args[subjectIdx + 1], out: args[outIdx + 1] };
}

/* ---- CSV parser (handles quoted fields with commas inside) ---- */
function splitCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
      else { inQuote = !inQuote; }
    } else if (c === ',' && !inQuote) {
      cells.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells;
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) { console.error('CSV has no data rows.'); process.exit(1); }
  const headers = splitCsvLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = splitCsvLine(line);
    const row  = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    return row;
  }).filter(r => r.id && r.id !== 'id'); // skip blank rows and any accidental duplicate headers
}

/* ---- row → reaction object ---- */
function rowToReaction(row) {
  const choices = [];
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const label   = row[`choice${letter}`];
    const correct = row[`choice${letter}_correct`] === 'true';
    if (label) choices.push([label, correct]);
  });

  if (choices.length < 2) {
    console.error(`Row "${row.id}": needs at least choiceA and choiceB.`);
    process.exit(1);
  }

  const prod = { type: row.prod_type || 'add' };
  if (row.prod_c1)     prod.c1     = row.prod_c1;
  if (row.prod_c2)     prod.c2     = row.prod_c2;
  if (row.prod_stereo) prod.stereo = row.prod_stereo;

  return {
    id:       row.id,
    name:     row.name,
    reagents: row.reagents,
    prod,
    decision: { q: row.decision_q, opts: choices },
    rule:     row.rule,
    trap:     row.trap_id || null,
    /* pedagogy fields — locked into schema */
    tier:             row.tier             || 'recognise',
    firstMove:        row.firstMove        || '',
    shortcut:         row.shortcut         || '',
    whyTrapTempting:  row.whyTrapTempting  || '',
    smiles:           row.smiles           || null,
  };
}

/* ---- build distractor pool from the reaction set ---- */
function buildPool(reactions) {
  const seen = new Set();
  const pool = [];
  const add  = p => { const k = `${p.type}:${p.c1||''}:${p.c2||''}`; if (!seen.has(k)) { seen.add(k); pool.push({...p}); } };
  reactions.forEach(r => add(r.prod));
  /* ensure a baseline of common distractors */
  [
    {type:'add',c1:'H',c2:'Br'}, {type:'add',c1:'Br',c2:'H'},
    {type:'add',c1:'H',c2:'OH'}, {type:'add',c1:'OH',c2:'H'},
    {type:'add',c1:'Br',c2:'Br'},{type:'add',c1:'Br',c2:'OH'},
    {type:'diol'}, {type:'epoxide'}, {type:'alkane'}, {type:'cleave'},
  ].forEach(add);
  return pool;
}

/* ---- default levels (override per subject if needed) ---- */
const DEFAULT_LEVELS = [
  {n:1, key:'recognise', tag:'L1 · RECOGNISE', cls:'',     lt:'RECOGNISE',      ld:'See the reagents → name the reaction. Pure pattern-spotting.'},
  {n:2, key:'toggle',    tag:'L2 · TOGGLE',    cls:'',     lt:'TOGGLE',         ld:'One reaction, one decision. Markovnikov? Syn or anti?'},
  {n:3, key:'predict',   tag:'L3 · PREDICT',   cls:'',     lt:'PREDICT',        ld:'Reagents on an alkene → pick the right product.'},
  {n:4, key:'reverse',   tag:'L4 · REVERSE',   cls:'boss', lt:'REVERSE (BOSS)', ld:'Here’s the product — what reagents made it?'},
  {n:5, key:'trap',      tag:'L5 · TRAP',       cls:'trap', lt:'TRAP',           ld:'Near-identical reagents, opposite answers. The exam’s favourite trick.'},
];

/* ---- validate required fields ---- */
const REQUIRED_COLS = [
  'id','name','reagents','tier','decision_q',
  'choiceA','choiceA_correct','choiceB','choiceB_correct',
  'prod_type','rule',
  'firstMove','shortcut','whyTrapTempting',
];
function validate(rows, headers) {
  const missing = REQUIRED_COLS.filter(c => !headers.includes(c));
  if (missing.length) {
    console.error(`CSV is missing required columns: ${missing.join(', ')}`);
    console.error('Run with no arguments to see the full column list.');
    process.exit(1);
  }
  rows.forEach(r => {
    if (!r.id)        { console.error(`Row with empty id found — check your CSV.`); process.exit(1); }
    if (!r.name)      { console.error(`Row "${r.id}": name is required.`);          process.exit(1); }
    if (!r.decision_q){ console.error(`Row "${r.id}": decision_q is required.`);    process.exit(1); }
  });
}

/* ---- main ---- */
function run() {
  const { input, subject, out } = parseArgs();

  const ext = path.extname(input).toLowerCase();
  if (ext !== '.csv') {
    console.error(`Input must be a .csv file. Got: ${ext}`);
    console.error('To use a DOCX worksheet: extract the Q&A by hand into the CSV template, then run this script.');
    process.exit(1);
  }

  const rawText = fs.readFileSync(input, 'utf-8');
  const rows    = parseCsv(rawText);
  const headers = splitCsvLine(rawText.split('\n')[0]).map(h => h.trim());

  validate(rows, headers);
  console.log(`Parsed ${rows.length} reactions from ${path.basename(input)}`);

  const reactions = rows.map(rowToReaction);
  const pool      = buildPool(reactions);

  const gameData = {
    subject,
    reactions,
    pool,
    levels: DEFAULT_LEVELS,
  };

  const outDir = path.dirname(out);
  if (outDir && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const js = `window.GAME_DATA = ${JSON.stringify(gameData, null, 2)};\n`;
  fs.writeFileSync(out, js, 'utf-8');

  console.log(`Written : ${out}`);
  console.log(`Reactions: ${reactions.length}  |  Pool items: ${pool.length}`);
  const trapCount = reactions.filter(r => r.trap).length;
  console.log(`Trap pairs: ${Math.floor(trapCount / 2)} (${trapCount} reactions have a trap_id)`);
}

run();

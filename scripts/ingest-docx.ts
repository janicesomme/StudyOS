/// <reference types="node" />
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import mammoth from 'mammoth'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ── Env loading ───────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = val
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!
const STUDENT_ID = process.env.STUDENT_ID!
const COURSE_ID = process.env.COURSE_ID!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY || !STUDENT_ID || !COURSE_ID) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, STUDENT_ID, COURSE_ID')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
const BUCKET = 'exam-question-images'

// ── Types ─────────────────────────────────────────────────────────────────────
type Token =
  | { type: 'label'; value: string }
  | { type: 'answer'; value: string }
  | { type: 'image'; idx: number }

type ImageState = 'labelled' | 'ai_suggested' | 'needs_review'

interface ClassifiedImage {
  idx: number
  buffer: Buffer
  contentType: string
  label: string | null
  answerKey: string | null
  state: ImageState
  aiProposedTopic?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const NAVIGATION_PREFIXES = ['MOVE TO', 'SEE ', 'CONTINUED', 'END OF']

function isNavigationNote(text: string): boolean {
  const upper = text.toUpperCase().trim()
  return NAVIGATION_PREFIXES.some(p => upper.startsWith(p))
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}

const SUPPORTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'])

// ── Parse .docx into ordered token stream ────────────────────────────────────
async function parseDocx(filePath: string): Promise<{
  tokens: Token[]
  imageBuffers: { buffer: Buffer; contentType: string }[]
}> {
  const imageBuffers: { buffer: Buffer; contentType: string }[] = []

  const result = await mammoth.convertToHtml(
    { path: filePath },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const raw = await image.read()
        const idx = imageBuffers.length
        imageBuffers.push({
          buffer: Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer),
          contentType: image.contentType ?? 'image/png',
        })
        return { src: `__IMG_${idx}__` }
      }),
    }
  )

  if (result.messages.length > 0) {
    for (const msg of result.messages) {
      if (msg.type === 'error') console.warn('  mammoth warning:', msg.message)
    }
  }

  const tokens: Token[] = []
  // Split on </p> boundaries; each paragraph is one logical unit
  const paras = result.value.split(/<\/p>|<br\s*\/?>/).map(p => p.replace(/^<p[^>]*>/, ''))

  for (const para of paras) {
    const imgMatch = para.match(/__IMG_(\d+)__/)
    if (imgMatch) {
      tokens.push({ type: 'image', idx: parseInt(imgMatch[1]) })
      continue
    }
    const text = stripTags(para).trim()
    if (!text) continue
    if (isNavigationNote(text)) continue
    if (/^[A-E]$/.test(text)) {
      tokens.push({ type: 'answer', value: text })
      continue
    }
    tokens.push({ type: 'label', value: text.toUpperCase() })
  }

  return { tokens, imageBuffers }
}

// ── Carry-down tagging ────────────────────────────────────────────────────────
function classifyImages(
  tokens: Token[],
  imageBuffers: { buffer: Buffer; contentType: string }[]
): ClassifiedImage[] {
  // Find answer letter closest to each image (forward scan to next image/label)
  function findNearestAnswer(imageTokenIdx: number): string | null {
    // Scan forward until next image or label
    for (let i = imageTokenIdx + 1; i < tokens.length; i++) {
      const t = tokens[i]
      if (t.type === 'answer') return t.value
      if (t.type === 'image' || t.type === 'label') break
    }
    return null
  }

  const results: ClassifiedImage[] = []
  let currentLabel: string | null = null

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'label') {
      currentLabel = token.value
      continue
    }
    if (token.type === 'answer') continue
    if (token.type === 'image') {
      const { buffer, contentType } = imageBuffers[token.idx]
      results.push({
        idx: token.idx,
        buffer,
        contentType,
        label: currentLabel,
        answerKey: findNearestAnswer(i),
        state: currentLabel ? 'labelled' : 'ai_suggested',
      })
    }
  }

  return results
}

// ── Vision: suggest topic for unlabelled images ───────────────────────────────
async function suggestTopic(
  image: ClassifiedImage,
  knownLabels: string[]
): Promise<{ topic: string | null; confident: boolean }> {
  if (!SUPPORTED_TYPES.has(image.contentType)) {
    console.warn(`    Unsupported image type ${image.contentType} for idx ${image.idx} — marking needs_review`)
    return { topic: null, confident: false }
  }

  const base64 = image.buffer.toString('base64')
  const mediaType = image.contentType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 64,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text:
              'This is an organic chemistry exam question image.\n' +
              `Existing topic labels for this chapter: ${knownLabels.join(', ')}.\n` +
              'Reply with ONLY one of those topic labels that best describes this question, or UNSURE if you cannot determine it.',
          },
        ],
      }],
    })

    const raw = response.content[0]?.type === 'text' ? response.content[0].text.trim().toUpperCase() : 'UNSURE'
    if (raw === 'UNSURE' || !knownLabels.map(l => l.toUpperCase()).includes(raw)) {
      return { topic: raw === 'UNSURE' ? null : raw, confident: false }
    }
    return { topic: raw, confident: true }
  } catch (err) {
    console.warn(`    Vision API error for idx ${image.idx}: ${String(err)}`)
    return { topic: null, confident: false }
  }
}

// ── Upload image to storage ───────────────────────────────────────────────────
async function uploadImage(
  image: ClassifiedImage,
  filename: string,
  position: number
): Promise<string> {
  const ext = image.contentType.split('/').pop() ?? 'png'
  const storagePath = `${STUDENT_ID}/${COURSE_ID}/${filename}/${String(position).padStart(4, '0')}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, image.buffer, {
      contentType: image.contentType,
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed for idx ${image.idx}: ${error.message}`)
  return storagePath
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function ingestFile(docxPath: string): Promise<void> {
  const filename = path.basename(docxPath, '.docx')
  console.log(`\nIngesting: ${path.basename(docxPath)}`)

  console.log('  Parsing document...')
  const { tokens, imageBuffers } = await parseDocx(docxPath)

  const labelSet = [...new Set(
    tokens.filter((t): t is { type: 'label'; value: string } => t.type === 'label').map(t => t.value)
  )]
  console.log(`  Labels found: ${labelSet.join(', ') || '(none)'}`)

  const images = classifyImages(tokens, imageBuffers)
  console.log(`  Images found: ${images.length}`)

  const unlabelled = images.filter(img => !img.label)
  if (unlabelled.length > 0) {
    console.log(`  Sending ${unlabelled.length} unlabelled image(s) to Claude vision...`)
    for (const img of unlabelled) {
      const { topic, confident } = await suggestTopic(img, labelSet)
      if (topic && confident) {
        img.label = topic
        img.state = 'ai_suggested'
      } else {
        img.label = topic
        img.state = 'needs_review'
      }
    }
  }

  console.log('  Uploading images and writing rows...')
  const rows: object[] = []
  let position = 0

  for (const img of images) {
    let storagePath: string
    try {
      storagePath = await uploadImage(img, filename, position)
    } catch (err) {
      console.error(`  Upload failed for image ${img.idx}: ${String(err)}`)
      position++
      continue
    }

    rows.push({
      student_id: STUDENT_ID,
      course_id: COURSE_ID,
      q_id: `IMG-${filename}-${String(position).padStart(4, '0')}`,
      source_doc: path.basename(docxPath),
      source_page: null,
      question_type: img.label ?? 'UNCLASSIFIED',
      pack: null,
      pattern: null,
      difficulty: 'E',
      suitable_use: null,
      janice_shortcut: null,
      student_visible_trigger: null,
      what_student_does: null,
      struggle_point: null,
      why_easy_in_system: null,
      pre_lesson_needed: null,
      topics: img.label ? [img.label] : [],
      reagents_involved: [],
      vocab_needed: [],
      related_knowledge_unit_ids: [],
      image_url: storagePath,
      ai_tagged: img.state !== 'labelled',
      answer_key: img.answerKey,
      verified: img.state === 'labelled',
    })
    position++
  }

  if (rows.length > 0) {
    // @ts-expect-error supabase-js v2 insert types incompatible with TypeScript 6
    const { error } = await supabase.from('exam_questions').insert(rows)
    if (error) throw new Error(`DB insert failed: ${error.message}`)
  }

  // ── Summary ──
  const labelled = images.filter(i => i.state === 'labelled').length
  const aiSuggested = images.filter(i => i.state === 'ai_suggested').length
  const needsReview = images.filter(i => i.state === 'needs_review').length

  console.log('\n  ── Summary ──────────────────────────────')
  console.log(`  labelled      : ${labelled}`)
  console.log(`  ai_suggested  : ${aiSuggested}`)
  console.log(`  needs_review  : ${needsReview}`)
  console.log(`  total inserted: ${rows.length}`)

  const flagged = images.filter(i => i.state !== 'labelled')
  if (flagged.length > 0) {
    console.log('\n  ── Flagged items (require teacher review) ───')
    for (const img of flagged) {
      const storagePath = `${STUDENT_ID}/${COURSE_ID}/${filename}/${String(images.indexOf(img)).padStart(4, '0')}`
      console.log(`  [${img.state}] idx=${img.idx}  proposed="${img.label ?? 'none'}"  path=${storagePath}`)
    }
  }
}

async function run(): Promise<void> {
  const docxDir = path.join(__dirname, '..', 'source_materials')
  if (!fs.existsSync(docxDir)) {
    console.error('source_materials/ directory not found. Place .docx files there and retry.')
    process.exit(1)
  }

  const files = fs.readdirSync(docxDir)
    .filter(f => f.toLowerCase().endsWith('.docx'))
    .map(f => path.join(docxDir, f))

  if (files.length === 0) {
    console.error('No .docx files found in source_materials/')
    process.exit(1)
  }

  console.log(`Found ${files.length} .docx file(s).`)
  for (const file of files) {
    await ingestFile(file)
  }
  console.log('\nDone.')
}

run().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})

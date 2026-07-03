import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { analyzeProfile } from '../src/lib/gap-analyzer.js'
import { parseFlags, printCliError, requireNumber } from './cli-args.js'
import { printGapAnalysis } from './report.js'

// ── CLI args ─────────────────────────────────────────────────────────────────

export function parseCliArgs(argv: string[]): { gpa: number; mcat: number } {
  const flags = parseFlags(argv)
  return { gpa: requireNumber(flags, 'gpa'), mcat: requireNumber(flags, 'mcat') }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { gpa, mcat } = parseCliArgs(process.argv.slice(2))

  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const result = await analyzeProfile(supabase, { gpa, mcat })
  printGapAnalysis(result)
}

const isMain = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  main().catch(err => {
    printCliError(err)
    process.exit(1)
  })
}

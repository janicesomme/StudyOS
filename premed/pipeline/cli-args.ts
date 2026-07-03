// Shared flag parsing + error printing for premed/pipeline/*.ts CLIs.
// Accepts both space-separated ("--gpa 3.6") and "=" ("--gpa=3.6") forms.

export function parseFlags(argv: string[]): Map<string, string> {
  const values = new Map<string, string>()
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const eq = arg.indexOf('=')
    if (eq !== -1) {
      values.set(arg.slice(2, eq), arg.slice(eq + 1))
    } else {
      values.set(arg.slice(2), argv[i + 1])
      i++
    }
  }
  return values
}

export function requireString(values: Map<string, string>, key: string): string {
  const v = values.get(key)
  if (!v) throw new Error(`Missing required --${key} <value> flag.`)
  return v
}

export function optionalString(values: Map<string, string>, key: string): string | undefined {
  return values.get(key)
}

export function requireNumber(values: Map<string, string>, key: string): number {
  const raw = requireString(values, key)
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new Error(`--${key} must be a number, got "${raw}".`)
  return n
}

export function optionalNumber(values: Map<string, string>, key: string): number | undefined {
  const raw = values.get(key)
  if (raw === undefined) return undefined
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new Error(`--${key} must be a number, got "${raw}".`)
  return n
}

function isZodError(err: unknown): err is { issues: { path: (string | number)[]; message: string }[] } {
  return typeof err === 'object' && err !== null && Array.isArray((err as { issues?: unknown }).issues)
}

/** Prints a Zod validation error as a clean field:message list, or falls back to the raw error message. */
export function printCliError(err: unknown): void {
  if (isZodError(err)) {
    console.error('Invalid input:')
    for (const issue of err.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  } else {
    console.error(err instanceof Error ? err.message : err)
  }
}

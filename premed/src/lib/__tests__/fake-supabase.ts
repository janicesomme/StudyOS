import { randomUUID } from 'crypto'

// Minimal in-memory Supabase client stand-in for CRUD-round-trip tests.
// Supports the query shapes actually used by profiles.ts, gap-analyzer.ts,
// school-comparison.ts, and the review-essay Edge Function handler:
// select/insert/update/upsert, eq/in/ilike/gt filters, order, limit,
// single/maybeSingle, count-only head selects, and the thenable
// (await-without-.then()) protocol postgrest-js relies on.

type Row = Record<string, unknown>

/**
 * Maps a bearer token to the { id } auth.users row it resolves to — opt-in,
 * only needed by callers (the review-essay Edge Function handler) that check
 * auth.getUser(). Absent/unknown tokens resolve to an auth error, matching
 * how a real invalid/missing JWT behaves.
 */
export function createFakeSupabase(seed: Record<string, Row[]> = {}, authUsersByToken: Record<string, { id: string }> = {}) {
  const tables: Record<string, Row[]> = {}
  for (const [name, rows] of Object.entries(seed)) tables[name] = rows.map(r => ({ ...r }))

  function makeChain(table: string) {
    if (!tables[table]) tables[table] = []
    let mode: 'select' | 'insert' | 'update' | 'upsert' = 'select'
    let payload: Row | undefined
    let onConflict: string | undefined
    const eqFilters: { col: string; val: unknown }[] = []
    const inFilters: { col: string; vals: unknown[] }[] = []
    const ilikeFilters: { col: string; pattern: RegExp }[] = []
    const gtFilters: { col: string; val: unknown }[] = []
    let wantSingle = false
    let wantMaybeSingle = false
    let wantHead = false
    let limitCount: number | undefined

    function matchesFilters(row: Row): boolean {
      return (
        eqFilters.every(f => row[f.col] === f.val) &&
        inFilters.every(f => f.vals.includes(row[f.col])) &&
        ilikeFilters.every(f => f.pattern.test(String(row[f.col]))) &&
        gtFilters.every(f => (row[f.col] as string | number) > (f.val as string | number))
      )
    }

    function execute(): { data: unknown; error: null; count?: number } {
      const rows = tables[table]

      if (mode === 'insert') {
        const row: Row = { id: randomUUID(), ...payload }
        rows.push(row)
        return { data: wantSingle ? row : [row], error: null }
      }

      if (mode === 'upsert') {
        const conflictCols = (onConflict ?? 'id').split(',').map(c => c.trim())
        const idx = rows.findIndex(r => conflictCols.every(col => r[col] === (payload as Row)[col]))
        if (idx >= 0) {
          rows[idx] = { ...rows[idx], ...payload }
          return { data: rows[idx], error: null }
        }
        const row: Row = { id: randomUUID(), ...payload }
        rows.push(row)
        return { data: row, error: null }
      }

      if (mode === 'update') {
        const matches = rows.filter(matchesFilters)
        matches.forEach(r => Object.assign(r, payload))
        return { data: wantSingle ? (matches[0] ?? null) : matches, error: null }
      }

      let matches = rows.filter(matchesFilters)
      const count = matches.length
      if (limitCount !== undefined) matches = matches.slice(0, limitCount)
      if (wantHead) return { data: null, error: null, count }
      if (wantSingle || wantMaybeSingle) return { data: matches[0] ?? null, error: null, count }
      return { data: matches, error: null, count }
    }

    const chain: unknown = {
      select(_cols?: string, opts?: { count?: 'exact'; head?: boolean }) {
        wantHead = opts?.head ?? false
        return chain
      },
      insert(row: Row) {
        mode = 'insert'
        payload = row
        return chain
      },
      update(patch: Row) {
        mode = 'update'
        payload = patch
        return chain
      },
      upsert(row: Row, opts?: { onConflict?: string }) {
        mode = 'upsert'
        payload = row
        onConflict = opts?.onConflict
        return chain
      },
      eq(col: string, val: unknown) {
        eqFilters.push({ col, val })
        return chain
      },
      in(col: string, vals: unknown[]) {
        inFilters.push({ col, vals })
        return chain
      },
      ilike(col: string, pattern: string) {
        const regexBody = pattern.split('%').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')
        ilikeFilters.push({ col, pattern: new RegExp(`^${regexBody}$`, 'i') })
        return chain
      },
      gt(col: string, val: unknown) {
        gtFilters.push({ col, val })
        return chain
      },
      limit(n: number) {
        limitCount = n
        return chain
      },
      order() {
        return chain
      },
      single() {
        wantSingle = true
        return chain
      },
      maybeSingle() {
        wantMaybeSingle = true
        return chain
      },
      then(onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) {
        return Promise.resolve(execute()).then(onFulfilled, onRejected)
      },
    }
    return chain
  }

  return {
    from(table: string) {
      return makeChain(table)
    },
    auth: {
      async getUser(token: string) {
        const user = authUsersByToken[token]
        if (!user) return { data: { user: null }, error: { message: 'Invalid or expired token' } }
        return { data: { user }, error: null }
      },
    },
    _tables: tables,
  }
}

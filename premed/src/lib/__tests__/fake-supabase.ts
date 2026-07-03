import { randomUUID } from 'crypto'

// Minimal in-memory Supabase client stand-in for CRUD-round-trip tests.
// Supports the query shapes actually used by profiles.ts and gap-analyzer.ts:
// select/insert/update/upsert, eq/in filters, order, single/maybeSingle, and
// the thenable (await-without-.then()) protocol postgrest-js relies on.

type Row = Record<string, unknown>

export function createFakeSupabase(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {}
  for (const [name, rows] of Object.entries(seed)) tables[name] = rows.map(r => ({ ...r }))

  function makeChain(table: string) {
    if (!tables[table]) tables[table] = []
    let mode: 'select' | 'insert' | 'update' | 'upsert' = 'select'
    let payload: Row | undefined
    let onConflict: string | undefined
    const eqFilters: { col: string; val: unknown }[] = []
    const inFilters: { col: string; vals: unknown[] }[] = []
    let wantSingle = false
    let wantMaybeSingle = false

    function matchesFilters(row: Row): boolean {
      return (
        eqFilters.every(f => row[f.col] === f.val) &&
        inFilters.every(f => f.vals.includes(row[f.col]))
      )
    }

    function execute(): { data: unknown; error: null } {
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

      const matches = rows.filter(matchesFilters)
      if (wantSingle || wantMaybeSingle) return { data: matches[0] ?? null, error: null }
      return { data: matches, error: null }
    }

    const chain: unknown = {
      select() {
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
    _tables: tables,
  }
}

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useRealProfileData } from '../useRealProfileData.js'
import { createFakeSupabase } from '../../lib/__tests__/fake-supabase.js'
import { createProfile } from '../../lib/profiles.js'

describe('useRealProfileData — userId=null (logged out)', () => {
  it('returns empty/default state with loading=false and makes no Supabase calls', async () => {
    const supabase = createFakeSupabase()
    const { result } = renderHook(() => useRealProfileData(supabase as never, null))

    expect(result.current.loading).toBe(false)
    expect(result.current.profile).toBeNull()
    expect(result.current.activities).toEqual([])
    expect(result.current.essayReviews).toEqual([])
    expect(result.current.error).toBeNull()
    // No tables were ever touched.
    expect((supabase as unknown as { _tables: Record<string, unknown[]> })._tables).toEqual({})
  })
})

describe('useRealProfileData — userId set (logged in)', () => {
  it('fetches the profile as before', async () => {
    const supabase = createFakeSupabase()
    const userId = '11111111-1111-4111-8111-111111111111'
    await createProfile(supabase as never, { user_id: userId, gpa_cum: 3.6, mcat_total: 508 })

    const { result } = renderHook(() => useRealProfileData(supabase as never, userId))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile?.user_id).toBe(userId)
  })

  it('drops a stale in-flight fetch result if userId changes before it resolves', async () => {
    const supabase = createFakeSupabase()
    const userIdA = '11111111-1111-4111-8111-111111111111'
    const userIdB = '22222222-2222-4222-8222-222222222222'
    await createProfile(supabase as never, { user_id: userIdA, gpa_cum: 3.6, mcat_total: 508 })
    await createProfile(supabase as never, { user_id: userIdB, gpa_cum: 3.9, mcat_total: 515 })

    const { result, rerender } = renderHook(({ userId }) => useRealProfileData(supabase as never, userId), {
      initialProps: { userId: userIdA as string | null },
    })

    // Switch to logged-out before the initial fetch for A can settle.
    rerender({ userId: null })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.profile).toBeNull()
  })
})

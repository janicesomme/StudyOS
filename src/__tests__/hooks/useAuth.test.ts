import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { useAuth } from '../../hooks/useAuth'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

describe('useAuth', () => {
  it('starts with loading true and no session', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()
  })

  it('sets loading false after session check completes', async () => {
    const { result } = renderHook(() => useAuth())
    await act(async () => {})
    expect(result.current.loading).toBe(false)
  })

  it('signUp surfaces both session and user from the Supabase response', async () => {
    const { supabase } = await import('../../lib/supabase')
    const fakeSession = { access_token: 'tok' }
    const fakeUser = { id: 'user-1', email: 'a@b.com' }
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { session: fakeSession, user: fakeUser },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth())
    let response!: Awaited<ReturnType<typeof result.current.signUp>>
    await act(async () => {
      response = await result.current.signUp('a@b.com', 'password123', 'A Name')
    })

    expect(response.error).toBeNull()
    expect(response.session).toEqual(fakeSession)
    expect(response.user).toEqual(fakeUser)
  })

  it('signUp surfaces a null session when email confirmation is required', async () => {
    const { supabase } = await import('../../lib/supabase')
    const fakeUser = { id: 'user-2', email: 'c@d.com' }
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
      data: { session: null, user: fakeUser },
      error: null,
    } as never)

    const { result } = renderHook(() => useAuth())
    let response!: Awaited<ReturnType<typeof result.current.signUp>>
    await act(async () => {
      response = await result.current.signUp('c@d.com', 'password123', 'C Name')
    })

    expect(response.session).toBeNull()
    expect(response.user).toEqual(fakeUser)
  })
})

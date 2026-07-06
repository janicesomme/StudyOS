import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PremedDashboard } from '../PremedDashboard.js'
import { createFakeSupabase } from '../../lib/__tests__/fake-supabase.js'

describe('PremedDashboard — logged out (userId=null)', () => {
  it('hides the "Real profile" toggle and only shows Demo', () => {
    const supabase = createFakeSupabase()
    render(<PremedDashboard supabase={supabase as never} userId={null} />)
    expect(screen.getByRole('button', { name: /^demo$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /real profile/i })).not.toBeInTheDocument()
  })

  it('renders loggedOutSlot alongside the demo content, not instead of it', () => {
    const supabase = createFakeSupabase()
    render(
      <PremedDashboard supabase={supabase as never} userId={null} loggedOutSlot={<div data-testid="auth-panel">Sign in here</div>} />
    )
    expect(screen.getByTestId('auth-panel')).toBeInTheDocument()
    // Demo content (archetype switcher) still renders alongside it.
    expect(screen.getByText(/read-only — seeded archetype data/i)).toBeInTheDocument()
  })

  it('never renders real-mode content (profile intake, essay review) when logged out', () => {
    const supabase = createFakeSupabase()
    render(<PremedDashboard supabase={supabase as never} userId={null} loggedOutSlot={<div>auth</div>} />)
    expect(screen.queryByText(/your profile/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/committee simulator/i)).not.toBeInTheDocument()
  })
})

describe('PremedDashboard — logged in (userId set)', () => {
  it('shows the "Real profile" toggle and no loggedOutSlot', () => {
    const supabase = createFakeSupabase()
    render(<PremedDashboard supabase={supabase as never} userId="11111111-1111-4111-8111-111111111111" loggedOutSlot={<div data-testid="auth-panel" />} />)
    expect(screen.getByRole('button', { name: /real profile/i })).toBeInTheDocument()
    expect(screen.queryByTestId('auth-panel')).not.toBeInTheDocument()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { PremedPage } from '../../pages/PremedPage'

const mockUseAuth = vi.fn()
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../../premed/src/ui/PremedDashboard', () => ({
  PremedDashboard: (props: { userId: string | null; loggedOutSlot?: React.ReactNode }) => (
    <div data-testid="premed-dashboard" data-user-id={props.userId ?? 'null'}>
      {props.loggedOutSlot}
    </div>
  ),
}))

function renderPremedPage() {
  return render(
    <MemoryRouter>
      <PremedPage />
    </MemoryRouter>
  )
}

describe('PremedPage', () => {
  it('shows a loading state while auth is resolving', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: true, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    renderPremedPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByTestId('premed-dashboard')).not.toBeInTheDocument()
  })

  it('renders the logged-out landing (pitch + dashboard with userId=null + loggedOutSlot) when there is no session', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    renderPremedPage()
    expect(screen.getByText(/premed/i)).toBeInTheDocument()
    const dashboard = screen.getByTestId('premed-dashboard')
    expect(dashboard).toHaveAttribute('data-user-id', 'null')
    // loggedOutSlot content (the inline auth panel) rendered inside it
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the real dashboard scoped to session.user.id when logged in', () => {
    mockUseAuth.mockReturnValue({
      session: { user: { id: 'real-user-123' } },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    renderPremedPage()
    const dashboard = screen.getByTestId('premed-dashboard')
    expect(dashboard).toHaveAttribute('data-user-id', 'real-user-123')
  })

  describe('logged-out auth panel', () => {
    function setLoggedOut() {
      mockUseAuth.mockReturnValue({ session: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    }

    it('toggles between login and signup views without navigating', async () => {
      setLoggedOut()
      renderPremedPage()
      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /create one/i }))
      expect(await screen.findByRole('heading', { name: /create your account/i })).toBeInTheDocument()
    })

    it('shows a check-your-email message when signup succeeds with no session', async () => {
      const signUp = vi.fn().mockResolvedValue({ error: null, session: null, user: { id: 'new-user' } })
      mockUseAuth.mockReturnValue({ session: null, loading: false, signIn: vi.fn(), signUp, signOut: vi.fn() })
      renderPremedPage()
      fireEvent.click(screen.getByRole('button', { name: /create one/i }))

      fireEvent.change(await screen.findByLabelText(/full name/i), { target: { value: 'A Name' } })
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } })
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
      expect(signUp).toHaveBeenCalledWith('a@b.com', 'password123', 'A Name')
    })
  })
})

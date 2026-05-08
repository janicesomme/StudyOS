import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { LoginForm } from '../../components/auth/LoginForm'

describe('LoginForm', () => {
  it('renders email, password inputs and submit button', () => {
    render(<LoginForm onSubmit={vi.fn()} loading={false} error={null} />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls onSubmit with email and password', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} loading={false} error={null} />)
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('test@test.com', 'password123'))
  })

  it('shows error message when error prop is set', () => {
    render(<LoginForm onSubmit={vi.fn()} loading={false} error="Invalid credentials" />)
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('disables submit button when loading', () => {
    render(<LoginForm onSubmit={vi.fn()} loading={true} error={null} />)
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})

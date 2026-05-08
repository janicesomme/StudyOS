import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { SignupForm } from '../../components/auth/SignupForm'

describe('SignupForm', () => {
  it('renders name, email, password inputs and submit button', () => {
    render(<SignupForm onSubmit={vi.fn()} loading={false} error={null} />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('calls onSubmit with name, email, and password', async () => {
    const onSubmit = vi.fn()
    render(<SignupForm onSubmit={onSubmit} loading={false} error={null} />)
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Smith' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jane@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Jane Smith', 'jane@test.com', 'password123'))
  })

  it('shows error message when error prop is set', () => {
    render(<SignupForm onSubmit={vi.fn()} loading={false} error="Email already in use" />)
    expect(screen.getByText('Email already in use')).toBeInTheDocument()
  })
})

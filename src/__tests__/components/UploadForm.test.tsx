import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { UploadForm } from '../../components/materials/UploadForm'

describe('UploadForm', () => {
  it('renders a file input and upload button', () => {
    render(<UploadForm onUpload={vi.fn()} uploading={false} error={null} />)
    expect(screen.getByLabelText(/file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument()
  })

  it('disables the button while uploading', () => {
    render(<UploadForm onUpload={vi.fn()} uploading={true} error={null} />)
    expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled()
  })

  it('calls onUpload with the selected file', () => {
    const onUpload = vi.fn()
    render(<UploadForm onUpload={onUpload} uploading={false} error={null} />)
    const file = new File(['content'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText(/file/i), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))
    expect(onUpload).toHaveBeenCalledWith(file)
  })

  it('does not call onUpload when no file is selected', () => {
    const onUpload = vi.fn()
    render(<UploadForm onUpload={onUpload} uploading={false} error={null} />)
    fireEvent.click(screen.getByRole('button', { name: /upload/i }))
    expect(onUpload).not.toHaveBeenCalled()
  })

  it('displays an error message when error prop is set', () => {
    render(<UploadForm onUpload={vi.fn()} uploading={false} error="Unsupported file type." />)
    expect(screen.getByText('Unsupported file type.')).toBeInTheDocument()
  })
})

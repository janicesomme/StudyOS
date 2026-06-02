import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import { MaterialCard } from '../../components/materials/MaterialCard'
import type { SourceMaterial } from '../../types/database'

const base: SourceMaterial = {
  id: 'mat-1',
  student_id: 'student-1',
  course_id: 'course-1',
  title: 'Lecture Notes Week 1',
  file_type: 'txt',
  file_url: 'student-1/course-1/notes.txt',
  processing_status: 'complete',
  extraction_confidence: 0.9,
  needs_review: false,
  error_message: null,
  created_at: '2026-05-08T00:00:00Z',
}

describe('MaterialCard', () => {
  it('renders the material title', () => {
    render(<MaterialCard material={base} onSelect={vi.fn()} selected={false} onDelete={vi.fn()} />)
    expect(screen.getByText('Lecture Notes Week 1')).toBeInTheDocument()
  })

  it('shows the processing status', () => {
    render(<MaterialCard material={base} onSelect={vi.fn()} selected={false} onDelete={vi.fn()} />)
    expect(screen.getByText('complete')).toBeInTheDocument()
  })

  it('shows failed status', () => {
    render(<MaterialCard material={{ ...base, processing_status: 'failed' }} onSelect={vi.fn()} selected={false} onDelete={vi.fn()} />)
    expect(screen.getByText('failed')).toBeInTheDocument()
  })

  it('shows error_message when status is failed', () => {
    render(
      <MaterialCard
        material={{ ...base, processing_status: 'failed', error_message: 'Claude API error' }}
        onSelect={vi.fn()}
        selected={false}
        onDelete={vi.fn()}
      />
    )
    expect(screen.getByText('Claude API error')).toBeInTheDocument()
  })

  it('calls onSelect with the material id when clicked', () => {
    const onSelect = vi.fn()
    render(<MaterialCard material={base} onSelect={onSelect} selected={false} onDelete={vi.fn()} />)
    fireEvent.click(screen.getByText('Lecture Notes Week 1'))
    expect(onSelect).toHaveBeenCalledWith('mat-1')
  })

  it('shows needs-review badge when needs_review is true', () => {
    render(<MaterialCard material={{ ...base, needs_review: true }} onSelect={vi.fn()} selected={false} onDelete={vi.fn()} />)
    expect(screen.getByText(/review/i)).toBeInTheDocument()
  })
})

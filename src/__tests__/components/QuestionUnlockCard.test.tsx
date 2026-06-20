import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuestionUnlockCard } from '../../components/nofear/QuestionUnlockCard'
import type { Ch10Question } from '../../types/nofear'
import { UNLOCK_LABELS } from '../../types/nofear'

const SAMPLE_QUESTION: Ch10Question = {
  questionId: '10.46a',
  smithPage: 440,
  problemArea: 'Reactions of Alkenes',
  questionType: 'Product prediction: HBr',
  knowledgeNeeded: 'Markovnikov rule; HBr addition to alkenes',
  requiredMoves: 'Identify alkene; apply Markovnikov; draw product',
  module0Unlock: 'complete',
  module1Unlock: 'complete',
  laterModuleNeeded: '',
  accuracyRisk: 'Low',
  notes: '',
}

describe('QuestionUnlockCard', () => {
  it('renders question ID', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText('10.46a')).toBeInTheDocument()
  })

  it('renders question type', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText('Product prediction: HBr')).toBeInTheDocument()
  })

  it('renders knowledge needed', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Markovnikov rule/)).toBeInTheDocument()
  })

  it('renders required moves as a numbered list', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText(/Identify alkene/)).toBeInTheDocument()
    expect(screen.getByText(/apply Markovnikov/)).toBeInTheDocument()
    expect(screen.getByText(/draw product/)).toBeInTheDocument()
  })

  it('renders unlock status label', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByText(UNLOCK_LABELS['complete'])).toBeInTheDocument()
  })

  it('shows textbook reminder when unlockStatus is complete', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(
      screen.getByText(/Open your Smith\/Gorzynski textbook to this question/)
    ).toBeInTheDocument()
  })

  it('shows textbook reminder when unlockStatus is partial', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="partial"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(
      screen.getByText(/Open your Smith\/Gorzynski textbook to this question/)
    ).toBeInTheDocument()
  })

  it('does not show textbook reminder when unlockStatus is not_yet', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="not_yet"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(
      screen.queryByText(/Open your Smith\/Gorzynski textbook to this question/)
    ).not.toBeInTheDocument()
  })

  it('renders progress controls', () => {
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onProgressChange when progress selection changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <QuestionUnlockCard
        question={SAMPLE_QUESTION}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={onChange}
      />
    )
    await user.selectOptions(screen.getByRole('combobox'), 'mastered')
    expect(onChange).toHaveBeenCalledWith('mastered')
  })

  it('handles empty accuracyRisk gracefully', () => {
    const question = { ...SAMPLE_QUESTION, accuracyRisk: '' }
    expect(() =>
      render(
        <QuestionUnlockCard
          question={question}
          unlockStatus="complete"
          progressStatus="not_started"
          onProgressChange={vi.fn()}
        />
      )
    ).not.toThrow()
  })

  it('handles empty requiredMoves gracefully', () => {
    const question = { ...SAMPLE_QUESTION, requiredMoves: '' }
    render(
      <QuestionUnlockCard
        question={question}
        unlockStatus="complete"
        progressStatus="not_started"
        onProgressChange={vi.fn()}
      />
    )
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

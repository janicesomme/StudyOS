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

function renderCard(overrides: Partial<Parameters<typeof QuestionUnlockCard>[0]> = {}) {
  return render(
    <QuestionUnlockCard
      question={SAMPLE_QUESTION}
      unlockStatus="complete"
      progressStatus="not_started"
      onProgressChange={vi.fn()}
      {...overrides}
    />
  )
}

describe('QuestionUnlockCard — always visible', () => {
  it('renders question ID', () => {
    renderCard()
    expect(screen.getByText('10.46a')).toBeInTheDocument()
  })

  it('renders question type', () => {
    renderCard()
    expect(screen.getByText('Product prediction: HBr')).toBeInTheDocument()
  })

  it('renders unlock status label', () => {
    renderCard()
    expect(screen.getByText(UNLOCK_LABELS['complete'])).toBeInTheDocument()
  })

  it('shows textbook reminder when unlockStatus is complete', () => {
    renderCard()
    expect(
      screen.getByText(/Open your Smith\/Gorzynski textbook to this question/)
    ).toBeInTheDocument()
  })

  it('shows textbook reminder when unlockStatus is partial', () => {
    renderCard({ unlockStatus: 'partial' })
    expect(
      screen.getByText(/Open your Smith\/Gorzynski textbook to this question/)
    ).toBeInTheDocument()
  })

  it('does not show textbook reminder when unlockStatus is not_yet', () => {
    renderCard({ unlockStatus: 'not_yet' })
    expect(
      screen.queryByText(/Open your Smith\/Gorzynski textbook to this question/)
    ).not.toBeInTheDocument()
  })

  it('renders progress controls', () => {
    renderCard()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onProgressChange when progress selection changes', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderCard({ onProgressChange: onChange })
    await user.selectOptions(screen.getByRole('combobox'), 'mastered')
    expect(onChange).toHaveBeenCalledWith('mastered')
  })
})

describe('QuestionUnlockCard — scaffold hidden by default', () => {
  it('hides Knowledge Needed before reveal', () => {
    renderCard()
    expect(screen.queryByText(/Markovnikov rule/)).not.toBeInTheDocument()
  })

  it('hides Required Moves before reveal', () => {
    renderCard()
    expect(screen.queryByText(/Identify alkene/)).not.toBeInTheDocument()
    expect(screen.queryByText(/apply Markovnikov/)).not.toBeInTheDocument()
  })

  it('shows Reveal scaffold button by default', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /Reveal scaffold/ })).toBeInTheDocument()
  })

  it('shows Show first hint button by default', () => {
    renderCard()
    expect(screen.getByRole('button', { name: /Show first hint/ })).toBeInTheDocument()
  })
})

describe('QuestionUnlockCard — progressive reveal', () => {
  it('shows hint text after clicking Show first hint', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Show first hint/ }))
    expect(screen.getByText(/Find the key functional group/)).toBeInTheDocument()
  })

  it('hides Show first hint button after clicking it', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Show first hint/ }))
    expect(
      screen.queryByRole('button', { name: /Show first hint/ })
    ).not.toBeInTheDocument()
  })

  it('still hides scaffold after clicking Show first hint', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Show first hint/ }))
    expect(screen.queryByText(/Markovnikov rule/)).not.toBeInTheDocument()
  })

  it('shows Knowledge Needed after clicking Reveal scaffold', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Reveal scaffold/ }))
    expect(screen.getByText(/Markovnikov rule/)).toBeInTheDocument()
  })

  it('shows Required Moves after clicking Reveal scaffold', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Reveal scaffold/ }))
    expect(screen.getByText(/Identify alkene/)).toBeInTheDocument()
    expect(screen.getByText(/apply Markovnikov/)).toBeInTheDocument()
    expect(screen.getByText(/draw product/)).toBeInTheDocument()
  })

  it('hides reveal buttons after scaffold is shown', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Reveal scaffold/ }))
    expect(
      screen.queryByRole('button', { name: /Reveal scaffold/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Show first hint/ })
    ).not.toBeInTheDocument()
  })

  it('shows Knowledge Needed when going hint then scaffold', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /Show first hint/ }))
    await user.click(screen.getByRole('button', { name: /Reveal scaffold/ }))
    expect(screen.getByText(/Markovnikov rule/)).toBeInTheDocument()
  })
})

describe('QuestionUnlockCard — edge cases', () => {
  it('handles empty accuracyRisk gracefully', () => {
    expect(() =>
      renderCard({ question: { ...SAMPLE_QUESTION, accuracyRisk: '' } })
    ).not.toThrow()
  })

  it('handles empty requiredMoves gracefully — no list before or after reveal', async () => {
    const user = userEvent.setup()
    renderCard({ question: { ...SAMPLE_QUESTION, requiredMoves: '' } })
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Reveal scaffold/ }))
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})

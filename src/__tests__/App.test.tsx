import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const mockUseAuth = vi.fn()
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('../../premed/src/ui/PremedDashboard', () => ({
  PremedDashboard: () => <div data-testid="premed-dashboard" />,
}))

// App.tsx renders every page eagerly via BrowserRouter's <Routes>, so mock out
// the other pages' heavy dependencies (Supabase-backed hooks) that aren't
// relevant to this routing-only test.
vi.mock('../pages/DashboardPage', () => ({ DashboardPage: () => <div>Dashboard</div> }))
vi.mock('../pages/CoursePage', () => ({ CoursePage: () => <div>Course</div> }))
vi.mock('../pages/ChapterTranslatorPage', () => ({ ChapterTranslatorPage: () => <div>Translator</div> }))
vi.mock('../pages/DrillPage', () => ({ DrillPage: () => <div>Drill</div> }))
vi.mock('../pages/ReviewImagesPage', () => ({ ReviewImagesPage: () => <div>ReviewImages</div> }))
vi.mock('../pages/ExamPickerPage', () => ({ ExamPickerPage: () => <div>ExamPicker</div> }))
vi.mock('../pages/QuestionUnlocksPage', () => ({ QuestionUnlocksPage: () => <div>QuestionUnlocks</div> }))
vi.mock('../pages/EasPracticePage', () => ({ EasPracticePage: () => <div>EasPractice</div> }))

import App from '../App'

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App routing', () => {
  it('/premed renders without redirecting when logged out', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    renderAt('/premed')
    expect(screen.getByTestId('premed-dashboard')).toBeInTheDocument()
  })

  it('/dashboard still redirects to /login when logged out', () => {
    mockUseAuth.mockReturnValue({ session: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    renderAt('/dashboard')
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })
})

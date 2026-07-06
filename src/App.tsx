import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { CoursePage } from './pages/CoursePage'
import { ChapterTranslatorPage } from './pages/ChapterTranslatorPage'
import { DrillPage } from './pages/DrillPage'
import { ReviewImagesPage } from './pages/ReviewImagesPage'
import { ExamPickerPage } from './pages/ExamPickerPage'
import { QuestionUnlocksPage } from './pages/QuestionUnlocksPage'
import { EasPracticePage } from './pages/EasPracticePage'
import { PremedPage } from './pages/PremedPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  )
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/courses/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
        <Route path="/courses/:id/translate" element={<ProtectedRoute><ChapterTranslatorPage /></ProtectedRoute>} />
        <Route path="/courses/:id/drill" element={<ProtectedRoute><DrillPage /></ProtectedRoute>} />
        <Route path="/courses/:id/exam-picker" element={<ProtectedRoute><ExamPickerPage /></ProtectedRoute>} />
        <Route path="/courses/:id/review-images" element={<ProtectedRoute><ReviewImagesPage /></ProtectedRoute>} />
        <Route path="/courses/:id/question-unlocks" element={<ProtectedRoute><QuestionUnlocksPage /></ProtectedRoute>} />
        <Route path="/eas-practice" element={<ProtectedRoute><EasPracticePage /></ProtectedRoute>} />
        {/* Public — PremedPage handles its own auth gating so logged-out visitors can still see demo mode. */}
        <Route path="/premed" element={<PremedPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

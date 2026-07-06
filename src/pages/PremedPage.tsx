import { useState } from 'react'
import { DashboardShell } from '../components/layout/DashboardShell'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { PremedDashboard } from '../../premed/src/ui/PremedDashboard'

type AuthView = 'login' | 'signup'

function LoggedOutAuthPanel() {
  const { signIn, signUp } = useAuth()
  const [view, setView] = useState<AuthView>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    // No navigation on success — the session updating flips PremedPage into its logged-in branch automatically.
    if (error) setError(error.message)
  }

  const handleSignup = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    // SignupForm emits (name, email, password); useAuth().signUp expects (email, password, name).
    const { error, session } = await signUp(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (session) {
      // Session present — PremedPage flips to the logged-in branch automatically.
    } else {
      // Project requires email confirmation — signUp succeeded but no session yet.
      setNeedsConfirmation(true)
    }
  }

  if (needsConfirmation) {
    return (
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <p className="text-sm text-gray-700">Check your email to confirm your account, then sign in below.</p>
      </section>
    )
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 max-w-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{view === 'login' ? 'Sign in' : 'Create your account'}</h2>
      {view === 'login' ? (
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      ) : (
        <SignupForm onSubmit={handleSignup} loading={loading} error={error} />
      )}
      <p className="mt-4 text-sm text-gray-500">
        {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => {
            setView(view === 'login' ? 'signup' : 'login')
            setError(null)
          }}
          className="text-indigo-600 font-medium hover:underline"
        >
          {view === 'login' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </section>
  )
}

export function PremedPage() {
  const { session, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Premed</h1>
            <p className="text-gray-500">Know your odds, close your gaps, and get your personal statement critiqued — before you submit.</p>
          </div>
          <PremedDashboard supabase={supabase} userId={null} loggedOutSlot={<LoggedOutAuthPanel />} />
        </main>
      </div>
    )
  }

  return (
    <DashboardShell onSignOut={() => signOut()}>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Premed</h1>
      <PremedDashboard supabase={supabase} userId={session.user.id} />
    </DashboardShell>
  )
}

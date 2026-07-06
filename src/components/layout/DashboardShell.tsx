import { type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

type Props = {
  children: ReactNode
  /** Overrides the default sign-out behavior (sign out then navigate to /login) — e.g. /premed signs out but stays put so its own logged-out view renders. */
  onSignOut?: () => Promise<void> | void
}

export function DashboardShell({ children, onSignOut }: Props) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut()
      return
    }
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-600">StudyOS</span>
        <nav className="flex items-center gap-4">
          <Link to="/premed" className="text-sm text-gray-500 hover:text-gray-700">
            Premed
          </Link>
          <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">
            Sign out
          </button>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

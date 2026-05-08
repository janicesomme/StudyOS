import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuth } from '../hooks/useAuth'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (name: string, email: string, password: string) => {
    setLoading(true)
    setError(null)
    const { error, emailSent } = await signUp(email, password, name)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else if (emailSent) {
      setEmailSent(true)
    } else {
      navigate('/dashboard')
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-500">
            We sent a confirmation link to your email address. Click it to activate your account, then{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">sign in</Link>.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Get started</h1>
        <p className="text-sm text-gray-500 mb-6">Create your StudyOS account</p>
        <SignupForm onSubmit={handleSubmit} loading={loading} error={error} />
        <p className="mt-4 text-sm text-center text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

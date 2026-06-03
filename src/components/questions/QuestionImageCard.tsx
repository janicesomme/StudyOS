import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  imagePath: string
  alt?: string
  className?: string
}

export function QuestionImageCard({ imagePath, alt = 'Exam question', className = '' }: Props) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase.storage
      .from('exam-question-images')
      .createSignedUrl(imagePath, 3600)
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err || !data?.signedUrl) { setError(true); return }
        setSignedUrl(data.signedUrl)
      })
    return () => { cancelled = true }
  }, [imagePath])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300 text-xs text-gray-400 p-8 ${className}`}>
        Image unavailable
      </div>
    )
  }

  if (!signedUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-8 ${className}`}>
        <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <img
      src={signedUrl}
      alt={alt}
      className={`rounded-lg border border-gray-200 max-w-full ${className}`}
    />
  )
}

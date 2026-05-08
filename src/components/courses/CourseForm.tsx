import { useState, type FormEvent } from 'react'

interface CourseFormProps {
  onSubmit: (name: string, subject: string, examDate: string) => void
  loading: boolean
  onCancel: () => void
}

export function CourseForm({ onSubmit, loading, onCancel }: CourseFormProps) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [examDate, setExamDate] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(name, subject, examDate)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="course-name" className="block text-sm font-medium text-gray-700 mb-1">Course name</label>
        <input id="course-name" type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g. Organic Chemistry 1" required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="course-subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input id="course-subject" type="text" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder="e.g. Chemistry" required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="exam-date" className="block text-sm font-medium text-gray-700 mb-1">Exam date (optional)</label>
        <input id="exam-date" type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Adding...' : 'Add course'}
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}

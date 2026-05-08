import { useState } from 'react'
import { DashboardShell } from '../components/layout/DashboardShell'
import { CourseForm } from '../components/courses/CourseForm'
import { useCourses } from '../hooks/useCourses'
import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { session } = useAuth()
  const { courses, loading, createCourse } = useCourses(session?.user.id)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)

  const handleCreateCourse = async (name: string, subject: string, examDate: string) => {
    setCreating(true)
    await createCourse({ name, subject, exam_date: examDate || undefined })
    setCreating(false)
    setShowForm(false)
  }

  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Today's Focus</h2>
          <p className="text-sm text-gray-400">Add a course and upload materials to get started.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="text-sm text-indigo-600 font-medium hover:underline">
                + Add
              </button>
            )}
          </div>
          {showForm && (
            <CourseForm onSubmit={handleCreateCourse} loading={creating} onCancel={() => setShowForm(false)} />
          )}
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : courses.length === 0 && !showForm ? (
            <p className="text-sm text-gray-400">No courses yet.</p>
          ) : (
            <ul className="space-y-2 mt-2">
              {courses.map(course => (
                <li key={course.id} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{course.name}</p>
                  <p className="text-xs text-gray-400">{course.subject}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

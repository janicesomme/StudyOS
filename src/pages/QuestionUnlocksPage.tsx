import { Link, useParams } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { QuestionUnlockPanel } from '../components/nofear/QuestionUnlockPanel'

export function QuestionUnlocksPage() {
  const { id: courseId } = useParams<{ id: string }>()

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link
          to={`/courses/${courseId}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          Back to course
        </Link>
      </div>
      <QuestionUnlockPanel />
    </DashboardShell>
  )
}

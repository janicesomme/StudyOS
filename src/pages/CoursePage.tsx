import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardShell } from '../components/layout/DashboardShell'
import { UploadForm } from '../components/materials/UploadForm'
import { MaterialCard } from '../components/materials/MaterialCard'
import { KnowledgeUnitList } from '../components/materials/KnowledgeUnitList'
import { useSourceMaterials } from '../hooks/useSourceMaterials'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { Course } from '../types/database'

export function CoursePage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const studentId = session?.user.id

  const { materials, loading: materialsLoading, uploadAndProcess } = useSourceMaterials(
    courseId,
    studentId
  )

  const [course, setCourse] = useState<Course | null>(null)
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !studentId) return
    supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('student_id', studentId)
      .single()
      .then(({ data }) => { if (data) setCourse(data as Course) })
  }, [courseId, studentId])

  const handleUpload = async (file: File) => {
    if (!courseId || !studentId) return
    setUploading(true)
    setUploadError(null)
    const { error } = await uploadAndProcess({ file, courseId, studentId })
    setUploading(false)
    if (error) setUploadError(error.message)
  }

  const handleSelectMaterial = (id: string) => {
    setSelectedMaterialId((prev) => (prev === id ? null : id))
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
        {course && (
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            <p className="text-sm text-gray-500">{course.subject}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Material</h2>
          <UploadForm onUpload={handleUpload} uploading={uploading} error={uploadError} />

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Materials</h3>
            {materialsLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : materials.length === 0 ? (
              <p className="text-sm text-gray-400">No materials yet. Upload a .txt file to start.</p>
            ) : (
              <div className="space-y-2">
                {materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onSelect={handleSelectMaterial}
                    selected={selectedMaterialId === material.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Knowledge Units</h2>
          {selectedMaterialId ? (
            <KnowledgeUnitList sourceMaterialId={selectedMaterialId} />
          ) : (
            <p className="text-sm text-gray-400 mt-4">
              {materials.length > 0
                ? 'Select a material on the left to view its extracted knowledge units.'
                : 'Upload a material to begin extraction.'}
            </p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}

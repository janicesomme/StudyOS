import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { SourceMaterial, SourceMaterialInsert } from '../types/database'

const ALLOWED_EXTENSIONS = ['txt', 'pdf'] as const
type AllowedExt = (typeof ALLOWED_EXTENSIONS)[number]

interface UploadInput {
  file: File
  courseId: string
  studentId: string
}

interface UseSourceMaterialsReturn {
  materials: SourceMaterial[]
  loading: boolean
  uploadAndProcess: (input: UploadInput) => Promise<{ error: Error | null }>
  deleteMaterial: (id: string) => Promise<{ error: Error | null }>
  refreshMaterials: () => Promise<void>
}

export function useSourceMaterials(
  courseId: string | undefined,
  studentId: string | undefined
): UseSourceMaterialsReturn {
  const [materials, setMaterials] = useState<SourceMaterial[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMaterials = useCallback(async () => {
    if (!courseId || !studentId) { setLoading(false); return }
    const { data } = await supabase
      .from('source_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    if (data) setMaterials(data as SourceMaterial[])
    setLoading(false)
  }, [courseId, studentId])

  useEffect(() => { fetchMaterials() }, [fetchMaterials])

  // Poll every 3 seconds while any material is pending or processing
  useEffect(() => {
    const hasActive = materials.some(
      (m) => m.processing_status === 'pending' || m.processing_status === 'processing'
    )
    if (!hasActive) return
    const interval = setInterval(fetchMaterials, 3000)
    return () => clearInterval(interval)
  }, [materials, fetchMaterials])

  const uploadAndProcess = async ({
    file,
    courseId,
    studentId,
  }: UploadInput): Promise<{ error: Error | null }> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !(ALLOWED_EXTENSIONS as readonly string[]).includes(fileExt)) {
      return { error: new Error('Unsupported file type. Only .txt and .pdf files are accepted.') }
    }
    const typedExt = fileExt as AllowedExt

    const filePath = `${studentId}/${courseId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file)

    if (uploadError) return { error: uploadError as Error }

    const insertData: SourceMaterialInsert = {
      student_id: studentId,
      course_id: courseId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      file_type: typedExt,
      file_url: filePath,
      processing_status: 'pending',
    }

    // Cast to any: supabase-js v2 insert+select chain is incompatible with TypeScript 6
    const { data: material, error: insertError } = await (supabase.from('source_materials') as any)
      .insert(insertData)
      .select()
      .single() as { data: SourceMaterial | null; error: { message: string } | null }

    if (insertError || !material) {
      return { error: new Error(insertError?.message ?? 'Insert failed') }
    }

    // Refresh immediately so UI shows pending status
    await fetchMaterials()

    // Fire-and-forget: polling picks up status changes while the function runs
    supabase.functions
      .invoke('archivist', { body: { source_material_id: material.id } })
      .then(({ error: fnError }) => {
        if (fnError) {
          // Cast to any: supabase-js v2 update chain incompatible with TypeScript 6
          ;(supabase.from('source_materials') as any)
            .update({ processing_status: 'failed', error_message: fnError.message })
            .eq('id', material.id)
        }
        fetchMaterials()
      })

    return { error: null }
  }

  const deleteMaterial = async (id: string): Promise<{ error: Error | null }> => {
    const material = materials.find(m => m.id === id)
    if (material?.file_url) {
      await supabase.storage.from('course-materials').remove([material.file_url])
    }
    const { error } = await supabase.from('source_materials').delete().eq('id', id)
    if (error) return { error: error as Error }
    await fetchMaterials()
    return { error: null }
  }

  return { materials, loading, uploadAndProcess, deleteMaterial, refreshMaterials: fetchMaterials }
}

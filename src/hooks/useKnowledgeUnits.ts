import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { KnowledgeUnit } from '../types/database'

interface UseKnowledgeUnitsReturn {
  units: KnowledgeUnit[]
  loading: boolean
}

export function useKnowledgeUnits(sourceMaterialId: string | undefined): UseKnowledgeUnitsReturn {
  const [units, setUnits] = useState<KnowledgeUnit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sourceMaterialId) { setLoading(false); return }

    supabase
      .from('knowledge_units')
      .select('*')
      .eq('source_material_id', sourceMaterialId)
      .then(({ data }) => {
        if (data) setUnits(data as KnowledgeUnit[])
        setLoading(false)
      })
  }, [sourceMaterialId])

  return { units, loading }
}

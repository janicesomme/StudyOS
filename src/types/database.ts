export type Database = {
  public: {
    Tables: {
      students: {
        Row: { id: string; email: string; name: string; onboarding_complete: boolean; created_at: string }
        Insert: { id?: string; email: string; name: string; onboarding_complete?: boolean; created_at?: string }
        Update: { email?: string; name?: string; onboarding_complete?: boolean }
      }
      student_profile: {
        Row: { id: string; student_id: string; learning_style: string | null; attention_span_minutes: number | null; academic_level: string | null; pressure_context: string | null; goals: string | null; preferred_explanation_styles: string[]; updated_at: string }
        Insert: { id?: string; student_id: string; learning_style?: string | null; attention_span_minutes?: number | null; academic_level?: string | null; pressure_context?: string | null; goals?: string | null; preferred_explanation_styles?: string[] }
        Update: { learning_style?: string | null; attention_span_minutes?: number | null; academic_level?: string | null; pressure_context?: string | null; goals?: string | null; preferred_explanation_styles?: string[]; updated_at?: string }
      }
      courses: {
        Row: { id: string; student_id: string; name: string; subject: string; institution: string | null; semester: string | null; exam_date: string | null; created_at: string }
        Insert: { id?: string; student_id: string; name: string; subject: string; institution?: string | null; semester?: string | null; exam_date?: string | null; created_at?: string }
        Update: { name?: string; subject?: string; institution?: string | null; semester?: string | null; exam_date?: string | null }
      }
      source_materials: {
        Row: {
          id: string
          student_id: string
          course_id: string
          title: string
          file_type: 'pdf' | 'txt'
          file_url: string
          processing_status: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence: number | null
          needs_review: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          title: string
          file_type: 'pdf' | 'txt'
          file_url: string
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence?: number | null
          needs_review?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence?: number | null
          needs_review?: boolean
          error_message?: string | null
        }
      }
      knowledge_units: {
        Row: {
          id: string
          student_id: string
          course_id: string
          source_material_id: string
          concept_name: string
          plain_english_explanation: string
          topic: string
          subtopic: string | null
          difficulty_level: number | null
          prerequisite_concept_ids: string[]
          common_misconceptions: string[]
          testability_score: number | null
          extraction_confidence: number | null
          source_location: string | null
          created_by_agent: string
          reviewed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          course_id: string
          source_material_id: string
          concept_name: string
          plain_english_explanation: string
          topic: string
          subtopic?: string | null
          difficulty_level?: number | null
          prerequisite_concept_ids?: string[]
          common_misconceptions?: string[]
          testability_score?: number | null
          extraction_confidence?: number | null
          source_location?: string | null
          created_by_agent?: string
          reviewed?: boolean
          created_at?: string
        }
        Update: { reviewed?: boolean }
      }
    }
  }
}

export type Student = Database['public']['Tables']['students']['Row']
export type StudentProfile = Database['public']['Tables']['student_profile']['Row']
export type Course = Database['public']['Tables']['courses']['Row']
export type SourceMaterial = Database['public']['Tables']['source_materials']['Row']
export type SourceMaterialInsert = Database['public']['Tables']['source_materials']['Insert']
export type KnowledgeUnit = Database['public']['Tables']['knowledge_units']['Row']

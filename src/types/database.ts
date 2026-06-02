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
        Row: { id: string; student_id: string; name: string; subject: string; institution: string | null; semester: string | null; exam_date: string | null; question_source: 'image_bank' | 'generated'; created_at: string }
        Insert: { id?: string; student_id: string; name: string; subject: string; institution?: string | null; semester?: string | null; exam_date?: string | null; question_source?: 'image_bank' | 'generated'; created_at?: string }
        Update: { name?: string; subject?: string; institution?: string | null; semester?: string | null; exam_date?: string | null; question_source?: 'image_bank' | 'generated' }
      }
      source_materials: {
        Row: {
          id: string; student_id: string; course_id: string; title: string
          file_type: 'pdf' | 'txt'; file_url: string
          processing_status: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence: number | null; needs_review: boolean; error_message: string | null; created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string; title: string
          file_type: 'pdf' | 'txt'; file_url: string
          processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'
          extraction_confidence?: number | null; needs_review?: boolean; error_message?: string | null; created_at?: string
        }
        Update: { processing_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'partial'; extraction_confidence?: number | null; needs_review?: boolean; error_message?: string | null }
      }
      knowledge_units: {
        Row: {
          id: string; student_id: string; course_id: string; source_material_id: string
          concept_name: string; plain_english_explanation: string; topic: string; subtopic: string | null
          difficulty_level: number | null; prerequisite_concept_ids: string[]; common_misconceptions: string[]
          testability_score: number | null; extraction_confidence: number | null; source_location: string | null
          created_by_agent: string; reviewed: boolean; created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string; source_material_id: string
          concept_name: string; plain_english_explanation: string; topic: string; subtopic?: string | null
          difficulty_level?: number | null; prerequisite_concept_ids?: string[]; common_misconceptions?: string[]
          testability_score?: number | null; extraction_confidence?: number | null; source_location?: string | null
          created_by_agent?: string; reviewed?: boolean; created_at?: string
        }
        Update: { reviewed?: boolean }
      }
      source_exams: {
        Row: {
          id: string; student_id: string; course_id: string
          course_code: string; year: number; exam_number: number
          original_filename: string; question_count: number | null; created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string
          course_code: string; year: number; exam_number: number
          original_filename: string; question_count?: number | null; created_at?: string
        }
        Update: { question_count?: number | null }
      }
      exam_questions: {
        Row: {
          id: string; student_id: string; course_id: string
          q_id: string; source_doc: string; source_page: string | null; question_type: string
          pack: string | null; pattern: string | null
          difficulty: 'E' | 'P+' | 'INT' | 'ADV'; suitable_use: string | null
          janice_shortcut: string | null; student_visible_trigger: string | null
          what_student_does: string | null; struggle_point: string | null
          why_easy_in_system: string | null; pre_lesson_needed: string | null
          topics: string[]; reagents_involved: string[]; vocab_needed: string[]
          related_knowledge_unit_ids: string[]
          image_url: string | null; ai_tagged: boolean; answer_key: string | null
          verified: boolean
          hint: string | null; answer_image_url: string | null
          source_exam_id: string | null; exam_number: number | null; exam_year: number | null
          question_order: number | null; point_value: number | null
          sub_parts: string[]; has_structure: boolean; raw_text: string | null
          created_at: string
        }
        Insert: {
          id?: string; student_id: string; course_id: string
          q_id: string; source_doc: string; source_page?: string | null; question_type: string
          pack?: string | null; pattern?: string | null
          difficulty: 'E' | 'P+' | 'INT' | 'ADV'; suitable_use?: string | null
          janice_shortcut?: string | null; student_visible_trigger?: string | null
          what_student_does?: string | null; struggle_point?: string | null
          why_easy_in_system?: string | null; pre_lesson_needed?: string | null
          topics?: string[]; reagents_involved?: string[]; vocab_needed?: string[]
          related_knowledge_unit_ids?: string[]
          image_url?: string | null; ai_tagged?: boolean; answer_key?: string | null
          verified?: boolean
          hint?: string | null; answer_image_url?: string | null
          source_exam_id?: string | null; exam_number?: number | null; exam_year?: number | null
          question_order?: number | null; point_value?: number | null
          sub_parts?: string[]; has_structure?: boolean; raw_text?: string | null
          created_at?: string
        }
        Update: {
          question_type?: string; verified?: boolean; ai_tagged?: boolean
          answer_key?: string | null; hint?: string | null; answer_image_url?: string | null
          question_order?: number | null; source_exam_id?: string | null
          exam_number?: number | null; exam_year?: number | null
          point_value?: number | null; sub_parts?: string[]; has_structure?: boolean; raw_text?: string | null
        }
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
export type SourceExam = Database['public']['Tables']['source_exams']['Row']
export type SourceExamInsert = Database['public']['Tables']['source_exams']['Insert']
export type ExamQuestion = Database['public']['Tables']['exam_questions']['Row']
export type ExamQuestionInsert = Database['public']['Tables']['exam_questions']['Insert']

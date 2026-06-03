import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TranslatorResultSchema, type TranslatorResult } from '../lib/customQuestions'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; result: TranslatorResult }
  | { status: 'error'; message: string }

export function useChapterTranslator(courseId: string | undefined) {
  const [state, setState] = useState<State>({ status: 'idle' })

  async function translate(chapterText: string, chapterTitle: string) {
    if (!courseId) return
    setState({ status: 'loading' })
    try {
      const { data, error } = await supabase.functions.invoke('chapter-translator', {
        body: { chapter_text: chapterText, course_id: courseId, chapter_title: chapterTitle },
      })
      if (error) {
        // Try to surface the actual error body from the edge function
        const detail = (error as { context?: { text?: () => Promise<string> } }).context?.text
          ? await (error as { context: { text: () => Promise<string> } }).context.text()
          : null
        throw new Error(detail ?? error.message)
      }
      const parsed = TranslatorResultSchema.safeParse(data)
      if (!parsed.success) {
        setState({ status: 'error', message: 'Response validation failed — some required teaching fields may be missing.' })
        return
      }
      setState({ status: 'done', result: parsed.data })
    } catch (err) {
      setState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  return { state, translate }
}

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { DashboardShell } from '../components/layout/DashboardShell'
import { useAuth } from '../hooks/useAuth'
import { useChapterTranslator } from '../hooks/useChapterTranslator'
import { useExamQuestions } from '../hooks/useExamQuestions'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n\n')
}

export function ChapterTranslatorPage() {
  const { id: courseId } = useParams<{ id: string }>()
  const { session } = useAuth()
  const studentId = session?.user.id

  const { state, translate } = useChapterTranslator(courseId)
  const { insertQuestions } = useExamQuestions(courseId, studentId)

  const [title, setTitle] = useState('')
  const [chapterText, setChapterText] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const floorMissing = state.status === 'done'
    ? state.result.topic_tags.filter(t => !state.result.floor_covered.includes(t))
    : []
  const floorAllCovered = floorMissing.length === 0

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfLoading(true)
    setPdfError(null)
    try {
      const text = await extractTextFromPdf(file)
      setChapterText(text)
      if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''))
    } catch {
      setPdfError('Could not read this PDF. Try copying and pasting the text manually.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chapterText.trim() || !title.trim()) return
    setSaved(null)
    setSaveError(null)
    translate(chapterText, title)
  }

  const handleSave = async () => {
    if (state.status !== 'done') return
    setSaving(true)
    setSaveError(null)
    const { count, error } = await insertQuestions(state.result.questions)
    setSaving(false)
    if (error) { setSaveError(error); return }
    setSaved(count)
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <Link to={`/courses/${courseId}`} className="text-sm text-indigo-600 hover:underline">
          Back to course
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Chapter Translator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a chapter to get key concepts and a plain-English rewrite.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chapter title / source
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3: Acids and Bases"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload PDF (optional)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              disabled={pdfLoading}
              className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
            />
            {pdfLoading && <p className="text-xs text-gray-400 mt-1">Reading PDF...</p>}
            {pdfError && <p className="text-xs text-red-500 mt-1">{pdfError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter text</label>
            <textarea
              value={chapterText}
              onChange={(e) => setChapterText(e.target.value)}
              placeholder="Paste the chapter text here..."
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={state.status === 'loading'}
            className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {state.status === 'loading' ? 'Translating...' : 'Translate Chapter'}
          </button>
        </form>
      </div>

      {state.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {state.status === 'done' && (
        <>
          {/* image_bank mode: no generated questions */}
          {state.result.questions.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Concepts</h2>
                <ul className="space-y-1">
                  {state.result.concepts.map((c, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-indigo-400 shrink-0 mt-0.5">-</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Plain English</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {state.result.plain_english}
                </p>
              </div>

              {state.result.topic_tags.length > 0 && (
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-sm font-medium text-gray-700">Floor coverage:</p>
                    <span className={`text-sm font-bold ${floorAllCovered ? 'text-green-600' : 'text-amber-600'}`}>
                      {state.result.floor_covered.length} / {state.result.topic_tags.length} exam topics
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${floorAllCovered ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      {floorAllCovered ? 'PASS' : 'INCOMPLETE'}
                    </span>
                  </div>
                  {!floorAllCovered && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-red-600 mb-1">Not covered:</p>
                      <div className="flex flex-wrap gap-2">
                        {floorMissing.map(t => (
                          <span key={t} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-medium">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {state.result.floor_covered.map(tag => (
                      <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/courses/${courseId}/drill?topics=${encodeURIComponent(state.result.topic_tags.join(','))}`}
                    className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 inline-block"
                  >
                    Drill these topics
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* generated mode: show question preview + save */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Concepts</h2>
                    <ul className="space-y-1">
                      {state.result.concepts.map((c, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-indigo-400 shrink-0 mt-0.5">-</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Plain English</h2>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {state.result.plain_english}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Questions ({state.result.questions.length})
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">Preview — add to drill queue to practice</p>
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {state.result.questions.map((q, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{q.q_id}</span>
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">
                            {q.difficulty}
                          </span>
                          {q.pattern && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {q.pattern}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">{q.question_type}</p>
                        <p className="text-xs text-gray-500 mt-1 italic">{q.janice_shortcut}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {saved === null ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : `Add ${state.result.questions.length} questions to drill queue`}
                      </button>
                      {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-700">{saved} questions added to drill queue.</p>
                      <Link
                        to={`/courses/${courseId}/drill`}
                        className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700"
                      >
                        Drill generated questions
                      </Link>
                    </>
                  )}
                </div>

                {state.result.topic_tags.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <p className="text-xs font-medium text-gray-500">Floor coverage:</p>
                      <span className={`text-xs font-bold ${floorAllCovered ? 'text-green-600' : 'text-amber-600'}`}>
                        {state.result.floor_covered.length} / {state.result.topic_tags.length} exam topics
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${floorAllCovered ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                        {floorAllCovered ? 'PASS' : 'INCOMPLETE'}
                      </span>
                    </div>
                    {!floorAllCovered && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-red-600 mb-1">Not covered:</p>
                        <div className="flex flex-wrap gap-2">
                          {floorMissing.map(t => (
                            <span key={t} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded font-medium">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {state.result.floor_covered.map(tag => (
                        <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/courses/${courseId}/drill?topics=${encodeURIComponent(state.result.topic_tags.join(','))}`}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Drill real exam questions for these topics
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </DashboardShell>
  )
}

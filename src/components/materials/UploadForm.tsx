import { useState, type FormEvent, type ChangeEvent } from 'react'

interface UploadFormProps {
  onUpload: (file: File) => void
  uploading: boolean
  error: string | null
}

export function UploadForm({ onUpload, uploading, error }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (file) onUpload(file)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="material-file" className="block text-sm font-medium text-gray-700 mb-1">
          File <span className="text-gray-400 font-normal">(.txt or .pdf)</span>
        </label>
        <input
          id="material-file"
          type="file"
          accept=".txt,.pdf"
          onChange={handleChange}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p className="mt-1 text-xs text-gray-400">PDF support is experimental.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  )
}

/// <reference types="node" />
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PYTHON_SCRIPT = path.join(__dirname, 'render-key-pages.py')

export function renderKeyPages(pdfPath: string, outputDir: string): string[] {
  const result = spawnSync('python', [PYTHON_SCRIPT, pdfPath, outputDir], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(`render-key-pages.py failed: ${result.stderr}`)
  }
  return result.stdout.trim().split(/\r?\n/).filter(Boolean)
}

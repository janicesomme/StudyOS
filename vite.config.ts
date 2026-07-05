import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Deno-only specifiers used by supabase/functions/review-essay/index.ts
      // (npm:/https: URL imports Deno resolves natively) — aliased to the
      // same npm packages so Vitest can import and unit-test the actual
      // deployed Edge Function file directly, no test-only duplicate needed.
      'npm:@anthropic-ai/sdk@0.96.0': '@anthropic-ai/sdk',
      'https://esm.sh/@supabase/supabase-js@2': '@supabase/supabase-js',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})

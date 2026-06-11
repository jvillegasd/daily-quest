import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dailyquest_test',
    },
    // Integration tests share one DB — run files sequentially to avoid truncation races
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    exclude: ['**/node_modules/**', 'tests/e2e/**'],
    environmentMatchGlobs: [
      ['tests/unit/components/**', 'jsdom'],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/**', 'app/api/**'],
      exclude: ['lib/db/prisma.ts'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})

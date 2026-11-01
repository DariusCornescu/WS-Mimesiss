import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // Point env loading at a directory without .env files so local or deployment
  // credentials never reach a test run.
  envDir: fileURLToPath(new URL('./tests/setup', import.meta.url)),
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // jsdom by default; route handler tests opt into `node` per file.
    environment: 'jsdom',
    include: ['tests/{unit,component,integration}/**/*.test.{ts,tsx}'],
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    env: {
      MONGODB_URI: '',
      STRIPE_SECRET_KEY: '',
      CLERK_SECRET_KEY: '',
      STRIPE_WEBHOOK_SECRET: '',
      CLERK_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      E2E_PREVIEW_BYPASS_SECRET: '',
    },
  },
})

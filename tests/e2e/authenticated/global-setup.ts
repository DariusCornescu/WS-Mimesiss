import { clerkSetup } from '@clerk/testing/playwright'
import { resolveAuthConfig, resolveTestTarget } from '../support/target'

// Only registered by playwright.config.ts when E2E_AUTHENTICATED=1. Runs once
// in the main process so the testing token reaches every worker.
export default async function globalSetup() {
  const auth = resolveAuthConfig(process.env, resolveTestTarget(process.env.E2E_BASE_URL))
  if (!auth) throw new Error('Authenticated setup ran without E2E_AUTHENTICATED=1')
  await clerkSetup({ publishableKey: auth.publishableKey, secretKey: auth.secretKey, dotenv: false })
}

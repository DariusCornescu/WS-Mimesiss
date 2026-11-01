/**
 * Browser test target and opt-in authentication guards.
 *
 * Pure functions with no test-runner imports, so the same rules are enforced by
 * playwright.config.ts at load time and covered by the unit suite.
 */

export type TestTarget = { origin: string; kind: 'loopback' | 'preview' }

export type AuthConfig = {
  publishableKey: string
  secretKey: string
  email: string
}

type Env = Record<string, string | undefined>

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])
// Production domains and the production Vercel alias. Kept in line with
// scripts/load/guard.mjs so load and browser tests refuse the same targets.
const PRODUCTION_DOMAIN = /(^|\.)(asmm\.ro|mimesiss\.ro)$/
const PRODUCTION_VERCEL_HOSTS = new Set(['ws-mimesiss.vercel.app'])
const PREVIEW_HOST = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.vercel\.app$/

export function resolveTestTarget(raw: string | undefined): TestTarget {
  if (!raw) {
    throw new Error(
      'E2E_BASE_URL is required. Point it at a running production build on loopback ' +
      '(for example http://127.0.0.1:3000) or at an https://<preview>.vercel.app deployment.'
    )
  }
  if (/[\s?#@]/.test(raw)) throw new Error('E2E_BASE_URL must be a bare origin without credentials, query or fragment')

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('E2E_BASE_URL is not a valid URL')
  }
  if (url.pathname !== '/') throw new Error('E2E_BASE_URL must not contain a path')

  const host = url.hostname.toLowerCase()
  if (PRODUCTION_DOMAIN.test(host) || PRODUCTION_VERCEL_HOSTS.has(host)) {
    throw new Error('Production targets are forbidden for browser tests')
  }

  if (LOOPBACK_HOSTS.has(host)) {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Loopback targets must use http or https')
    return { origin: url.origin, kind: 'loopback' }
  }

  if (host.endsWith('.vercel.app')) {
    if (url.protocol !== 'https:') throw new Error('Preview targets must use https')
    if (url.port) throw new Error('Preview targets must not specify a port')
    if (!PREVIEW_HOST.test(host)) throw new Error('Preview host must be a single <name>.vercel.app label')
    return { origin: url.origin, kind: 'preview' }
  }

  throw new Error(`Unknown test target host "${host}". Only loopback and *.vercel.app previews are allowed.`)
}

/**
 * Returns null unless authenticated tests were explicitly requested. When they
 * were, every requirement must hold or the run stops before any browser starts.
 */
export function resolveAuthConfig(env: Env, target: TestTarget): AuthConfig | null {
  if (env.E2E_AUTHENTICATED !== '1') return null

  if ((env.CI || env.GITHUB_EVENT_NAME) && env.GITHUB_EVENT_NAME !== 'workflow_dispatch') {
    throw new Error('Authenticated browser tests only run from a manually dispatched workflow')
  }
  if (target.kind !== 'preview') {
    throw new Error('Authenticated browser tests require an https://<preview>.vercel.app target')
  }

  const publishableKey = env.CLERK_PUBLISHABLE_KEY ?? ''
  const secretKey = env.CLERK_SECRET_KEY ?? ''
  const email = env.E2E_CLERK_USER_EMAIL ?? ''

  if (!publishableKey.startsWith('pk_test_')) {
    throw new Error('CLERK_PUBLISHABLE_KEY must be a development-instance key (pk_test_)')
  }
  if (!secretKey.startsWith('sk_test_')) {
    throw new Error('CLERK_SECRET_KEY must be a development-instance key (sk_test_)')
  }
  // Dedicated test identities only: the +clerk_test marker keeps real
  // participant accounts out of automated sign-in.
  if (!/^[^\s@]+\+clerk_test@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('E2E_CLERK_USER_EMAIL must be a dedicated "+clerk_test" address')
  }

  return { publishableKey, secretKey, email }
}

import { describe, expect, it } from 'vitest'
import { resolveAuthConfig, resolveTestTarget, type TestTarget } from '../e2e/support/target'

describe('resolveTestTarget', () => {
  it('fails when no explicit target is given', () => {
    expect(() => resolveTestTarget(undefined)).toThrow(/E2E_BASE_URL is required/)
    expect(() => resolveTestTarget('')).toThrow(/E2E_BASE_URL is required/)
  })

  it.each([
    ['http://127.0.0.1:3000', 'http://127.0.0.1:3000'],
    ['http://localhost:3000/', 'http://localhost:3000'],
    ['http://[::1]:3000', 'http://[::1]:3000'],
  ])('accepts loopback %s', (raw, origin) => {
    expect(resolveTestTarget(raw)).toEqual({ origin, kind: 'loopback' })
  })

  it('accepts an https preview deployment', () => {
    expect(resolveTestTarget('https://ws-mimesiss-git-feature-asmm.vercel.app')).toEqual({
      origin: 'https://ws-mimesiss-git-feature-asmm.vercel.app',
      kind: 'preview',
    })
  })

  it.each([
    'https://asmm.ro',
    'https://www.asmm.ro',
    'https://clerk.asmm.ro',
    'https://mimesiss.ro',
    'https://ws-mimesiss.vercel.app',
  ])('rejects production target %s', raw => {
    expect(() => resolveTestTarget(raw)).toThrow(/Production targets are forbidden/)
  })

  it.each([
    'https://example.com',
    'https://vercel.app',
    'https://localhost.example.com',
    'https://preview.vercel.app.example.com',
    'http://10.0.0.5:3000',
  ])('rejects unknown host %s', raw => {
    expect(() => resolveTestTarget(raw)).toThrow()
  })

  it.each([
    ['plain http preview', 'http://preview-asmm.vercel.app'],
    ['preview with port', 'https://preview-asmm.vercel.app:8443'],
    ['nested preview subdomain', 'https://a.b.vercel.app'],
    ['path', 'http://127.0.0.1:3000/congres'],
    ['query', 'http://127.0.0.1:3000/?x=1'],
    ['fragment', 'http://127.0.0.1:3000/#main'],
    ['credentials', 'https://user:pass@preview-asmm.vercel.app'],
    ['non-http scheme', 'ftp://127.0.0.1'],
    ['garbage', 'not a url'],
  ])('rejects %s', (_label, raw) => {
    expect(() => resolveTestTarget(raw)).toThrow()
  })
})

describe('resolveAuthConfig', () => {
  const preview: TestTarget = { origin: 'https://preview-asmm.vercel.app', kind: 'preview' }
  const loopback: TestTarget = { origin: 'http://127.0.0.1:3000', kind: 'loopback' }
  const env = {
    E2E_AUTHENTICATED: '1',
    CLERK_PUBLISHABLE_KEY: 'pk_test_fixture',
    CLERK_SECRET_KEY: 'sk_test_fixture',
    E2E_CLERK_USER_EMAIL: 'participant+clerk_test@example.com',
  }

  it('stays disabled unless explicitly requested', () => {
    expect(resolveAuthConfig({ ...env, E2E_AUTHENTICATED: undefined }, preview)).toBeNull()
    expect(resolveAuthConfig({ ...env, E2E_AUTHENTICATED: 'true' }, preview)).toBeNull()
  })

  it('returns development-instance configuration for a preview target', () => {
    expect(resolveAuthConfig(env, preview)).toEqual({
      publishableKey: 'pk_test_fixture',
      secretKey: 'sk_test_fixture',
      email: 'participant+clerk_test@example.com',
    })
  })

  it('refuses production keys', () => {
    expect(() => resolveAuthConfig({ ...env, CLERK_PUBLISHABLE_KEY: 'pk_live_fixture' }, preview)).toThrow(/pk_test_/)
    expect(() => resolveAuthConfig({ ...env, CLERK_SECRET_KEY: 'sk_live_fixture' }, preview)).toThrow(/sk_test_/)
    expect(() => resolveAuthConfig({ ...env, CLERK_SECRET_KEY: undefined }, preview)).toThrow(/sk_test_/)
  })

  it('refuses ordinary participant accounts', () => {
    expect(() => resolveAuthConfig({ ...env, E2E_CLERK_USER_EMAIL: 'participant@example.com' }, preview)).toThrow(/clerk_test/)
  })

  it('refuses loopback targets and automatic workflow events', () => {
    expect(() => resolveAuthConfig(env, loopback)).toThrow(/preview/)
    expect(() => resolveAuthConfig({ ...env, GITHUB_EVENT_NAME: 'pull_request' }, preview)).toThrow(/manually dispatched/)
    expect(() => resolveAuthConfig({ ...env, GITHUB_EVENT_NAME: 'pull_request_target' }, preview)).toThrow(/manually dispatched/)
    expect(() => resolveAuthConfig({ ...env, CI: 'true' }, preview)).toThrow(/manually dispatched/)
    expect(resolveAuthConfig({ ...env, GITHUB_EVENT_NAME: 'workflow_dispatch' }, preview)).not.toBeNull()
  })
})

// @vitest-environment node
import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// clerkMiddleware is replaced by a pass-through that exposes a controllable
// auth(), so only the proxy's own decisions are exercised.
const mocks = vi.hoisted(() => ({ userId: null as string | null, protect: vi.fn() }))

vi.mock('@clerk/nextjs/server', () => ({
  createRouteMatcher: (patterns: string[]) => {
    const expressions = patterns.map(pattern => new RegExp(`^${pattern}$`))
    return (req: NextRequest) => expressions.some(expression => expression.test(req.nextUrl.pathname))
  },
  clerkMiddleware: (handler: (auth: unknown, req: NextRequest) => unknown) => (req: NextRequest) => {
    const auth = Object.assign(async () => ({ userId: mocks.userId }), { protect: mocks.protect })
    return handler(auth, req)
  },
}))

import proxy from '@/proxy'

const ORIGIN = 'https://site.example'
const event = {} as never

function request(method: string, path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`${ORIGIN}${path}`, { method, headers })
}

beforeEach(() => {
  mocks.userId = null
  mocks.protect.mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe('proxy origin and authentication gate', () => {
  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])('rejects a cross-origin %s to an API route', async method => {
    const response = await proxy(request(method, '/api/payments/create-payment-intent', { origin: 'https://evil.example' }), event)
    expect(response?.status).toBe(403)
  })

  it('rejects a mutating API request with no Origin header', async () => {
    const response = await proxy(request('POST', '/api/auth/complete-profile'), event)
    expect(response?.status).toBe(403)
  })

  it('lets the Stripe webhook through without an Origin header', async () => {
    const response = await proxy(request('POST', '/api/payments/webhook'), event)
    expect(response).toBeUndefined()
  })

  it('answers unauthenticated /api/admin requests with JSON 401, not a redirect', async () => {
    const response = await proxy(request('GET', '/api/admin/users'), event)
    expect(response?.status).toBe(401)
    expect(await response?.json()).toEqual({ error: 'Unauthorized' })
  })

  it('lets a signed-in same-origin admin API request reach the handler, which owns the role check', async () => {
    mocks.userId = 'user_1'
    const response = await proxy(request('PATCH', '/api/admin/tickets/status', { origin: ORIGIN }), event)
    expect(response).toBeUndefined()
  })

  it.each(['/dashboard', '/dashboard/tickets', '/admin', '/admin/users'])('protects %s through Clerk', async path => {
    await proxy(request('GET', path), event)
    expect(mocks.protect).toHaveBeenCalledTimes(1)
  })

  it('never treats an API path as publicly renderable', async () => {
    const response = await proxy(request('GET', '/api/admin/gallery'), event)
    expect(response?.status).toBe(401)
  })

  it('does not honour the local preview bypass outside development', async () => {
    vi.stubEnv('ASMM_LOCAL_PREVIEW', '1')
    const response = await proxy(request('GET', '/api/admin/users'), event)
    expect(response?.status).toBe(401)
  })
})

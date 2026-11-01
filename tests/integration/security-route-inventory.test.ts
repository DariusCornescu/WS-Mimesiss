// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// Static inventory of every route handler under src/app/api. A new route fails
// this test until it is added here with a deliberate access decision, and each
// listed route must still contain its authorization gate in source.
const API_ROOT = join(process.cwd(), 'src', 'app', 'api')

const ADMIN = /requireRole\('admin'\)/
const STAFF = /requireRole\('admin', 'moderator'\)/
const SIGNED_IN = /currentUser\(\)/

const EXPECTED: Record<string, { methods: string[]; gate: RegExp | null; note: string }> = {
  'admin/attendance/[userId]': { methods: ['GET', 'PATCH'], gate: STAFF, note: 'staff' },
  'admin/gallery': { methods: ['GET', 'POST'], gate: ADMIN, note: 'admin' },
  'admin/gallery/[id]': { methods: ['GET', 'PUT', 'DELETE'], gate: ADMIN, note: 'admin' },
  'admin/partners': { methods: ['POST', 'PATCH', 'DELETE'], gate: ADMIN, note: 'admin' },
  'admin/payments': { methods: ['POST'], gate: ADMIN, note: 'admin' },
  'admin/payments/delete': { methods: ['DELETE'], gate: ADMIN, note: 'admin' },
  'admin/project-images': { methods: ['GET', 'POST'], gate: ADMIN, note: 'admin' },
  'admin/tickets/lookup': { methods: ['GET'], gate: STAFF, note: 'staff' },
  'admin/tickets/status': { methods: ['PATCH'], gate: STAFF, note: 'staff' },
  'admin/users': { methods: ['GET'], gate: ADMIN, note: 'admin' },
  'auth/complete-profile': { methods: ['POST'], gate: SIGNED_IN, note: 'signed in' },
  'payments/cancel-pending': { methods: ['POST'], gate: SIGNED_IN, note: 'signed in' },
  'payments/create-checkout': { methods: ['POST'], gate: null, note: 'public, always 410' },
  'payments/create-payment-intent': { methods: ['POST'], gate: SIGNED_IN, note: 'signed in' },
  'payments/webhook': { methods: ['POST'], gate: /constructEvent\(/, note: 'Stripe signature' },
  'project-images/[id]': { methods: ['GET'], gate: null, note: 'public by design (partner and gallery images)' },
  session: { methods: ['GET'], gate: null, note: 'public, returns only a signedIn boolean' },
  'users/[clerkId]': { methods: ['GET'], gate: SIGNED_IN, note: 'signed in and owner only' },
}

function routeFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return routeFiles(path)
    return entry.name === 'route.ts' ? [path] : []
  })
}

function exportedMethods(source: string) {
  const found = new Set<string>()
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) found.add(match[1])
  return [...found].sort()
}

const routes = routeFiles(API_ROOT).map(file => ({
  key: relative(API_ROOT, join(file, '..')).split(sep).join('/'),
  source: readFileSync(file, 'utf8'),
}))

describe('API route inventory', () => {
  it('lists exactly the routes that have a recorded access decision', () => {
    expect(routes.map(route => route.key).sort()).toEqual(Object.keys(EXPECTED).sort())
  })

  it.each(routes)('$key exports only the expected methods', ({ key, source }) => {
    expect(exportedMethods(source)).toEqual([...EXPECTED[key].methods].sort())
  })

  it.each(routes.filter(route => EXPECTED[route.key]?.gate))('$key contains its authorization gate', ({ key, source }) => {
    expect(source).toMatch(EXPECTED[key].gate as RegExp)
  })

  it('never lets a moderator-level gate guard an admin-only route', () => {
    for (const route of routes.filter(route => EXPECTED[route.key]?.note === 'admin')) {
      expect(route.source).not.toMatch(/requireRole\([^)]*'moderator'/)
    }
  })

  // admin/payments returns error.message as `details` and logs the whole saved
  // payment (see the audit findings). These two tests pin the known list so a
  // new route doing the same is noticed; remove the entry once fixed.
  it('only the known route echoes raw error messages to callers', () => {
    const leaking = routes.filter(route => /details:\s*error instanceof Error \? error\.message/.test(route.source)).map(route => route.key)
    expect(leaking).toEqual(['admin/payments'])
  })

  it('only the known route logs a whole payment document', () => {
    const logging = routes.filter(route => /console\.log\(/.test(route.source)).map(route => route.key)
    expect(logging).toEqual(['admin/payments'])
  })
})

// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Isolated route test: authentication, the database connection and the model
// are replaced, so no auth provider or database is contacted.
const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  connectDB: vi.fn(),
  findOne: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ currentUser: mocks.currentUser }))
vi.mock('@/lib/mongodb', () => ({ default: mocks.connectDB }))
vi.mock('@/models', () => ({ User: { findOne: mocks.findOne } }))

import { GET } from '@/app/api/users/[clerkId]/route'

// The "database": roles live here, as in production, not on the auth identity.
const users: Record<string, { clerkId: string; email: string; role: 'user' | 'admin'; userType: string }> = {
  user_a: { clerkId: 'user_a', email: 'a@example.com', role: 'user', userType: 'student' },
  user_b: { clerkId: 'user_b', email: 'b@example.com', role: 'user', userType: 'rezident' },
  user_admin: { clerkId: 'user_admin', email: 'admin@example.com', role: 'admin', userType: 'rezident' },
}

function signedInAs(id: string | null) {
  mocks.currentUser.mockResolvedValue(id ? { id } : null)
}

function call(clerkId: string) {
  const request = new NextRequest(`http://127.0.0.1/api/users/${encodeURIComponent(clerkId)}`)
  return GET(request, { params: Promise.resolve({ clerkId }) })
}

beforeEach(() => {
  mocks.currentUser.mockReset()
  mocks.connectDB.mockReset().mockResolvedValue(undefined)
  mocks.findOne.mockReset().mockImplementation(({ clerkId }: { clerkId: string }) => ({
    lean: async () => users[clerkId] ?? null,
  }))
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('GET /api/users/[clerkId]', () => {
  it('rejects anonymous callers without touching the database', async () => {
    signedInAs(null)
    const response = await call('user_a')
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Unauthorized' })
    expect(mocks.connectDB).not.toHaveBeenCalled()
    expect(mocks.findOne).not.toHaveBeenCalled()
  })

  it('returns user A their own profile, queried by their own id only', async () => {
    signedInAs('user_a')
    const response = await call('user_a')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(users.user_a)
    expect(mocks.findOne).toHaveBeenCalledTimes(1)
    expect(mocks.findOne).toHaveBeenCalledWith({ clerkId: 'user_a' })
  })

  it('forbids user A from reading user B and never queries B', async () => {
    signedInAs('user_a')
    const response = await call('user_b')
    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
    expect(mocks.connectDB).not.toHaveBeenCalled()
    expect(mocks.findOne).not.toHaveBeenCalled()
  })

  it('forbids user B from reading user A', async () => {
    signedInAs('user_b')
    expect((await call('user_a')).status).toBe(403)
    expect(mocks.findOne).not.toHaveBeenCalled()
  })

  it('is owner-only even for administrators (admin listing lives under /api/admin/users)', async () => {
    signedInAs('user_admin')
    expect((await call('user_a')).status).toBe(403)
    expect(mocks.findOne).not.toHaveBeenCalled()

    const own = await call('user_admin')
    expect(own.status).toBe(200)
    expect((await own.json()).role).toBe('admin')
  })

  it('compares identifiers exactly', async () => {
    signedInAs('user_a')
    const zeroWidthSpace = String.fromCharCode(0x200b)
    for (const variant of ['USER_A', 'user_a ', ' user_a', `user_a${zeroWidthSpace}`]) {
      expect((await call(variant)).status).toBe(403)
    }
    expect(mocks.findOne).not.toHaveBeenCalled()
  })

  it('returns 404 when the signed-in user has no database profile yet', async () => {
    signedInAs('user_without_profile')
    const response = await call('user_without_profile')
    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ error: 'User not found' })
  })

  it('hides database failure details behind a generic 500', async () => {
    signedInAs('user_a')
    mocks.connectDB.mockRejectedValue(new Error('connection string mongodb://secret-host failed'))
    const response = await call('user_a')
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toEqual({ error: 'Internal server error' })
    expect(JSON.stringify(body)).not.toContain('secret-host')
  })
})

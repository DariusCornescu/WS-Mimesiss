// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ currentUser: vi.fn(), sync: vi.fn() }))

vi.mock('@clerk/nextjs/server', () => ({ currentUser: mocks.currentUser }))
vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/auth', () => ({ syncUserWithDatabase: mocks.sync }))

import { GET } from '@/app/qr/[userId]/route'

// next/navigation redirect() throws; the digest carries the target path.
async function redirectTarget(userId: string, role: string) {
  mocks.currentUser.mockResolvedValue({ id: 'staff_1' })
  mocks.sync.mockResolvedValue({ clerkId: 'staff_1', role })
  try {
    await GET(new NextRequest('http://127.0.0.1/qr/x'), { params: Promise.resolve({ userId }) })
  } catch (error) {
    return String((error as { digest?: string }).digest).split(';')[2]
  }
  throw new Error('expected a redirect')
}

beforeEach(() => vi.clearAllMocks())

describe('GET /qr/[userId]', () => {
  it('sends anonymous scanners to the public programme', async () => {
    mocks.currentUser.mockResolvedValue(null)
    await expect(GET(new NextRequest('http://127.0.0.1/qr/user_1'), { params: Promise.resolve({ userId: 'user_1' }) }))
      .rejects.toMatchObject({ digest: expect.stringContaining('/congres/program') })
  })

  it('sends ordinary users to the programme, never to attendance pages', async () => {
    expect(await redirectTarget('user_2', 'user')).toBe('/congres/program')
  })

  it('sends moderators to the moderator attendance page and admins to the admin one', async () => {
    expect(await redirectTarget('user_2', 'moderator')).toBe('/dashboard/moderator/attendance/user_2')
    expect(await redirectTarget('user_2', 'admin')).toBe('/admin/attendance/user_2')
  })

  // Finding: the decoded path segment is interpolated into the redirect without
  // encoding, so a crafted QR URL can steer a signed-in moderator or admin to
  // another same-origin path. `it.fails` passes while the gap exists and starts
  // failing once the id is encoded or validated; then drop `.fails`.
  it.fails('keeps a crafted userId inside the attendance path', async () => {
    const target = await redirectTarget('../../admin/settings', 'admin')
    expect(target).not.toContain('..')
    expect(target.startsWith('/admin/attendance/')).toBe(true)
  })

  it.fails('does not let an encoded query string reach the redirect target', async () => {
    const target = await redirectTarget('user_2?next=/admin', 'moderator')
    expect(target).not.toContain('?')
  })
})

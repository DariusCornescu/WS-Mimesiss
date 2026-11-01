// @vitest-environment node
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Handlers are called directly. Authentication, the database connection and the
// models are replaced, so nothing outside the process is contacted.
const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  userFindOne: vi.fn(),
  userSync: vi.fn(),
  ticketFindOne: vi.fn(),
  registrationFind: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ currentUser: mocks.currentUser, clerkClient: vi.fn() }))
vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue({ connection: { readyState: 1 } }) }))
vi.mock('@/models', () => ({
  User: { findOne: mocks.userFindOne, findOneAndUpdate: mocks.userSync },
  IssuedTicket: { findOne: mocks.ticketFindOne },
  Registration: { find: mocks.registrationFind },
  Workshop: { find: vi.fn() },
}))

import { GET as lookup } from '@/app/api/admin/tickets/lookup/route'
import { GET as attendance } from '@/app/api/admin/attendance/[userId]/route'

const staff = { id: 'staff_1', primaryEmailAddress: { emailAddress: 's@example.com' }, emailAddresses: [] }

function lookupCall(value: string) {
  return lookup(new NextRequest(`http://127.0.0.1/api/admin/tickets/lookup?number=${encodeURIComponent(value)}`))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  // First findOne call is the caller sync inside requireRole (role from the
  // database), later calls are the lookups made by the handlers.
  const database = (query: { clerkId: string }) => ({
    lean: async () => query.clerkId === 'staff_1'
      ? { clerkId: 'staff_1', firstName: 'Staff', lastName: 'Member', userType: 'rezident', role: 'moderator', email: 's@example.com' }
      : { clerkId: query.clerkId, firstName: 'Ana', lastName: 'Pop', email: 'ana@example.com', userType: 'student' },
  })
  mocks.userFindOne.mockImplementation(database)
  mocks.userSync.mockImplementation(database)
})

describe('GET /api/admin/tickets/lookup', () => {
  beforeEach(() => {
    mocks.currentUser.mockResolvedValue(staff)
    mocks.ticketFindOne.mockImplementation(() => ({ lean: async () => null }))
  })

  it('rejects anonymous callers', async () => {
    mocks.currentUser.mockResolvedValue(null)
    expect((await lookupCall('12')).status).toBe(401)
    expect(mocks.ticketFindOne).not.toHaveBeenCalled()
  })

  it('rejects non-numeric input and queries nothing', async () => {
    expect((await lookupCall('abc')).status).toBe(400)
    expect(mocks.ticketFindOne).not.toHaveBeenCalled()
  })

  it('queries by the parsed number for a plain integer', async () => {
    await lookupCall('12')
    expect(mocks.ticketFindOne).toHaveBeenCalledWith({ ticketNumber: 12 })
  })

  // Finding: Number() accepts hex, exponent, Infinity and padded input, so the
  // validation is looser than the plain ticket numbers the scanner produces.
  it.fails.each(['0x10', '1e3', 'Infinity', ' 7 ', '-1', '1.5'])('rejects %j as a ticket number', async value => {
    expect((await lookupCall(value)).status).toBe(400)
  })
})

describe('admin API with a signed-in user whose profile is incomplete', () => {
  beforeEach(() => {
    mocks.currentUser.mockResolvedValue({ id: 'user_new', primaryEmailAddress: { emailAddress: 'n@example.com' }, emailAddresses: [] })
    const incomplete = () => ({ lean: async () => ({ clerkId: 'user_new', role: 'user', email: 'n@example.com' }) })
    mocks.userFindOne.mockImplementation(incomplete)
    mocks.userSync.mockImplementation(incomplete)
  })

  // Finding: syncUserWithDatabase calls redirect(), which throws NEXT_REDIRECT
  // inside a route handler. The handler catch turns it into a 500 and logs it,
  // where a 403 is the correct answer for a caller who is not staff.
  it.fails('answers 403 instead of 500', async () => {
    const response = await attendance(new NextRequest('http://127.0.0.1/api/admin/attendance/x'), { params: Promise.resolve({ userId: 'x' }) })
    expect(response.status).toBe(403)
  })
})

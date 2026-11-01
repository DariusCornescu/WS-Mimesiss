// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ findById: vi.fn() }))

vi.mock('@clerk/nextjs/server', () => ({ currentUser: vi.fn().mockResolvedValue(null) }))
vi.mock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/lib/auth', () => ({ syncUserWithDatabase: vi.fn() }))
vi.mock('@/lib/request-security', () => ({ limitRequests: vi.fn(), RequestError: class extends Error {} }))
vi.mock('@/lib/settings', () => ({ getUncachedAppSettings: vi.fn() }))
vi.mock('@/lib/registration', () => ({ registerUserForWorkshop: vi.fn() }))
vi.mock('@/lib/editions', () => ({ getActiveEdition: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/models', () => ({
  Workshop: { findById: mocks.findById },
  Registration: {},
  User: {},
}))

import { getWorkshopById } from '@/app/congres/workshops/actions'

const ID = '0123456789abcdef01234567'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

describe('getWorkshopById (used by the public /congres/workshops/[id] page)', () => {
  it('returns null for a malformed id without querying', async () => {
    expect(await getWorkshopById('not-an-id')).toBeNull()
    expect(mocks.findById).not.toHaveBeenCalled()
  })

  it('returns an active workshop to an anonymous caller', async () => {
    mocks.findById.mockReturnValue({ lean: async () => ({ _id: ID, title: 'Suturi', status: 'active' }) })
    expect(await getWorkshopById(ID)).toMatchObject({ title: 'Suturi' })
  })

  // Finding: the lookup ignores status, edition and the workshopVisibleToPublic
  // setting, so a cancelled or unpublished workshop is readable by anyone who
  // knows or guesses its ObjectId. Drop `.fails` once the read is gated.
  it.fails('does not return a cancelled workshop to an anonymous caller', async () => {
    mocks.findById.mockReturnValue({ lean: async () => ({ _id: ID, title: 'Anulat', status: 'cancelled' }) })
    expect(await getWorkshopById(ID)).toBeNull()
  })
})

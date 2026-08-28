import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import connectDB from '@/lib/mongodb'
import { Edition } from '@/models'

export interface ActiveEdition {
  _id: string
  year: number
  title: string
}

/**
 * Resolve the single active edition (Edition.status === 'active').
 *
 * Nothing in the app writes editions yet — scripts/migrate-editions.mjs and
 * direct DB updates manage them — so the 'active-edition' tag has no in-app
 * trigger and the 300s TTL is the effective refresh. The tag exists so a
 * future admin CRUD can expire it instantly with updateTag('active-edition').
 *
 * Note the migration script creates the 2025 edition as 'archived': having NO
 * active edition is the normal between-editions state, and callers must treat
 * null as "registrations closed / nothing publicly listed".
 */
async function readActiveEdition(): Promise<ActiveEdition | null> {
  await connectDB()

  const doc = await Edition.findOne({ status: 'active' })
    .sort({ year: -1 })
    .select('year title')
    .lean() as { _id: unknown; year: number; title: string } | null

  return doc ? { _id: String(doc._id), year: doc.year, title: doc.title } : null
}

const cachedActiveEdition = unstable_cache(readActiveEdition, ['active-edition'], {
  tags: ['active-edition'],
  revalidate: 300,
})

export const getActiveEdition = cache((): Promise<ActiveEdition | null> => cachedActiveEdition())

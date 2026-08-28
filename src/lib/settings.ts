import { cache } from 'react'
import { unstable_cache, updateTag } from 'next/cache'
import connectDB from '@/lib/mongodb'
import { AppSettings } from '@/models'
import type { IAppSettings } from '@/models'

/**
 * Plain, serializable settings shape used by everything outside this module.
 * Dates are ISO strings so the object can cross the RSC boundary and live in
 * unstable_cache without a Mongoose document in sight.
 */
export interface AppSettingsPlain {
  eventMode: 'workshops' | 'ball'
  globalRegistrationEnabled: boolean
  paymentsEnabled: boolean
  workshopVisibleToPublic: boolean
  allowCancelRegistration: boolean
  registrationStartTime: string | null
  registrationDeadline: string | null
  defaultMaxParticipants: number
  ballTicketAvailableFrom: string | null
  ballTicketAvailableTo: string | null
  ballMaxTicketsPerUser: number
}

// Default settings
const DEFAULT_SETTINGS = {
  eventMode: 'workshops' as const,
  globalRegistrationEnabled: true,
  paymentsEnabled: false,
  workshopVisibleToPublic: false,
  allowCancelRegistration: true,
  registrationDeadline: undefined,
  defaultMaxParticipants: 20,
  ballMaxTicketsPerUser: 2,
}

const toIso = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null

/**
 * Pure read: merges defaults in memory instead of lazily patching the
 * database, so caching this can never write. Creating the settings document
 * lives on the write path only (updateAppSettings upserts with defaults).
 */
async function readSettings(): Promise<AppSettingsPlain> {
  await connectDB()

  const doc = await AppSettings.findOne().lean() as Partial<IAppSettings> | null

  return {
    eventMode: doc?.eventMode ?? DEFAULT_SETTINGS.eventMode,
    globalRegistrationEnabled: doc?.globalRegistrationEnabled ?? DEFAULT_SETTINGS.globalRegistrationEnabled,
    paymentsEnabled: doc?.paymentsEnabled ?? DEFAULT_SETTINGS.paymentsEnabled,
    workshopVisibleToPublic: doc?.workshopVisibleToPublic ?? DEFAULT_SETTINGS.workshopVisibleToPublic,
    allowCancelRegistration: doc?.allowCancelRegistration ?? DEFAULT_SETTINGS.allowCancelRegistration,
    registrationStartTime: toIso(doc?.registrationStartTime),
    registrationDeadline: toIso(doc?.registrationDeadline),
    defaultMaxParticipants: doc?.defaultMaxParticipants ?? DEFAULT_SETTINGS.defaultMaxParticipants,
    ballTicketAvailableFrom: toIso(doc?.ballTicketAvailableFrom),
    ballTicketAvailableTo: toIso(doc?.ballTicketAvailableTo),
    ballMaxTicketsPerUser: doc?.ballMaxTicketsPerUser ?? DEFAULT_SETTINGS.ballMaxTicketsPerUser,
  }
}

const cachedSettings = unstable_cache(readSettings, ['app-settings'], {
  tags: ['app-settings'],
  revalidate: 300, // belt-and-braces TTL on top of the tag invalidation below
})

/**
 * Cached settings read. unstable_cache serves it across requests until a
 * write revalidates the 'app-settings' tag (or the TTL passes); React's
 * cache() dedupes within one request, so the root layout plus any page
 * calling this hit the store at most once per render.
 */
export const getAppSettings = cache((): Promise<AppSettingsPlain> => cachedSettings())

/**
 * Update app settings (creates the document on first write).
 */
export async function updateAppSettings(updates: Partial<IAppSettings>): Promise<void> {
  await connectDB()

  const settings = await AppSettings.findOne()

  if (!settings) {
    await AppSettings.create({ ...DEFAULT_SETTINGS, ...updates })
  } else {
    const updated = await AppSettings.findByIdAndUpdate(
      settings._id,
      { $set: updates },
      { new: true }
    )
    if (!updated) {
      throw new Error('Failed to update settings')
    }
  }

  // updateTag: expire the cached read AND refresh it in the same action, so
  // the admin sees their own write immediately (server-action-only API).
  updateTag('app-settings')
}

/**
 * Reset settings to defaults
 */
export async function resetAppSettings(): Promise<void> {
  await connectDB()

  const settings = await AppSettings.findOne()

  if (!settings) {
    await AppSettings.create(DEFAULT_SETTINGS)
  } else {
    const updated = await AppSettings.findByIdAndUpdate(
      settings._id,
      { $set: DEFAULT_SETTINGS },
      { new: true }
    )
    if (!updated) {
      throw new Error('Failed to reset settings')
    }
  }

  updateTag('app-settings')
}

/**
 * Check if global registration is enabled
 */
export async function isGlobalRegistrationEnabled(): Promise<boolean> {
  const settings = await getAppSettings()
  return settings.globalRegistrationEnabled
}

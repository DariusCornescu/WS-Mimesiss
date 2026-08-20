import connectDB from '@/lib/mongodb'
import { AppSettings } from '@/models'
import type { IAppSettings } from '@/models'

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

/**
 * Get app settings from database or create default if doesn't exist.
 * Also patches any fields that were added to the schema after the document
 * was first created (lazy migration — safe and idempotent).
 */
export async function getAppSettings(): Promise<IAppSettings> {
  await connectDB()
  
  let settings = await AppSettings.findOne()
  
  if (!settings) {
    settings = await AppSettings.create(DEFAULT_SETTINGS)
    return settings
  }

  // Lazily migrate fields that may be missing in documents created before
  // they were added to the schema. Only write if something is actually missing.
  const patch: Partial<typeof DEFAULT_SETTINGS> = {}
  for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS) as [keyof typeof DEFAULT_SETTINGS, unknown][]) {
    if (settings[key] === undefined || settings[key] === null) {
      (patch as Record<string, unknown>)[key] = defaultValue
    }
  }

  if (Object.keys(patch).length > 0) {
    settings = await AppSettings.findByIdAndUpdate(
      settings._id,
      { $set: patch },
      { new: true }
    ) ?? settings
  }
  
  return settings
}

/**
 * Update app settings
 */
export async function updateAppSettings(updates: Partial<IAppSettings>): Promise<IAppSettings> {
  await connectDB()
  
  // Find existing settings or create new ones
  let settings = await AppSettings.findOne()
  
  if (!settings) {
    // Create new settings with updates
    settings = await AppSettings.create({ ...DEFAULT_SETTINGS, ...updates })
  } else {
    // Update existing settings
    settings = await AppSettings.findByIdAndUpdate(
      settings._id,
      { $set: updates },
      { new: true }
    )
  }
  
  if (!settings) {
    throw new Error('Failed to update settings')
  }
  
  return settings
}

/**
 * Reset settings to defaults
 */
export async function resetAppSettings(): Promise<IAppSettings> {
  await connectDB()
  
  // Find existing settings
  let settings = await AppSettings.findOne()
  
  if (!settings) {
    // Create new settings with defaults
    settings = await AppSettings.create(DEFAULT_SETTINGS)
  } else {
    // Update existing settings with defaults
    settings = await AppSettings.findByIdAndUpdate(
      settings._id,
      { $set: DEFAULT_SETTINGS },
      { new: true }
    )
  }
  
  if (!settings) {
    throw new Error('Failed to reset settings')
  }
  
  return settings
}

/**
 * Check if global registration is enabled
 */
export async function isGlobalRegistrationEnabled(): Promise<boolean> {
  const settings = await getAppSettings()
  return settings.globalRegistrationEnabled
}

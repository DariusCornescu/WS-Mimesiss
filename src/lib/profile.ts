import { clerkClient, type User as ClerkUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { registrationProfile, profileDetails } from '@/lib/registration-profile'

/** A problem with what the participant typed; the message is safe to show them. */
export class ProfileError extends Error {}

/**
 * Saves the base profile (names and category). With `withDetails`, the phone,
 * institution and study fields are validated and saved too; without it they
 * are left as they are, so finishing sign-up never wipes them.
 */
export async function saveProfile(user: ClerkUser, input: unknown, options: { withDetails?: boolean } = {}) {
  const profile = registrationProfile(input)
  if (!profile) throw new ProfileError('Completează numele și alege un profil valid.')
  const details = options.withDetails ? profileDetails(input, profile.userType) : undefined
  if (details === null) throw new ProfileError('Completează un număr de telefon valid și instituția. Verifică și anul ales.')
  const email = user.primaryEmailAddress?.emailAddress
  if (!email || user.primaryEmailAddress?.verification?.status !== 'verified') {
    throw new ProfileError('Verifică adresa de email înainte de a continua.')
  }
  await connectDB()
  await (await clerkClient()).users.updateUser(user.id, {
    firstName: profile.firstName, lastName: profile.lastName,
  })
  const set: Record<string, unknown> = { ...profile, email }
  const unset: Record<string, ''> = {}
  if (details) {
    for (const [key, value] of Object.entries(details)) {
      if (value === null) unset[key] = ''
      else set[key] = value
    }
  }
  // Only validated fields are persisted; existing roles are never rewritten.
  return User.findOneAndUpdate({ clerkId: user.id }, {
    $set: set,
    ...(Object.keys(unset).length > 0 && { $unset: unset }),
    $setOnInsert: { clerkId: user.id, role: 'user' },
  }, { upsert: true, new: true, runValidators: true }).lean()
}

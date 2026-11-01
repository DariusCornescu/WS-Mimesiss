import { clerkClient, type User as ClerkUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { registrationProfile } from '@/lib/registration-profile'

export async function saveProfile(user: ClerkUser, input: unknown) {
  const profile = registrationProfile(input)
  if (!profile) throw new Error('Completează numele și alege un profil valid.')
  const email = user.primaryEmailAddress?.emailAddress
  if (!email || user.primaryEmailAddress?.verification?.status !== 'verified') {
    throw new Error('Verifică adresa de email înainte de a continua.')
  }
  await connectDB()
  await (await clerkClient()).users.updateUser(user.id, {
    firstName: profile.firstName, lastName: profile.lastName,
  })
  // Only validated fields are persisted; existing roles are never rewritten.
  return User.findOneAndUpdate({ clerkId: user.id }, {
    $set: { ...profile, email },
    $setOnInsert: { clerkId: user.id, role: 'user' },
  }, { upsert: true, new: true, runValidators: true }).lean()
}

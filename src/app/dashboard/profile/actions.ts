'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { requireRole, AuthError } from '@/lib/auth'
import { User } from '@/types/models'
import { saveProfile } from '@/lib/profile'
import { limitRequests } from '@/lib/request-security'
import { User as MongoUser } from '@/models'
import connectDB from '@/lib/mongodb'

export async function updateProfile(formData: FormData) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  const firstName = formData.get('firstName')
  const lastName = formData.get('lastName')
  const userType = formData.get('userType')

  try {
    await limitRequests(clerkUser.id, 'profile-save')
    await saveProfile(clerkUser, { firstName, lastName, userType })

    // Revalidate the profile page to reflect changes
    revalidatePath('/dashboard/profile')

    return { success: true, message: 'Profilul a fost actualizat cu succes!' }
  } catch (error) {
    console.error('Error updating profile:', error)
    throw new Error('A apărut o eroare la actualizarea profilului.')
  }
}


export async function getUser(userId: string): Promise<User | null> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new AuthError(401, 'Autentificare necesară')
  }

  // Staff can look up any user (the attendance pages need this); everyone
  // else can only read their own record.
  if (clerkUser.id !== userId) {
    await requireRole('admin', 'moderator')
  }

  await connectDB()
  return await MongoUser.findOne({ clerkId: userId }).lean() as User | null
}

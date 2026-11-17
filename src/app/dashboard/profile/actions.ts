'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { requireRole, AuthError } from '@/lib/auth'
import { User } from '@/types/models'
import { saveProfile, ProfileError } from '@/lib/profile'
import { limitRequests, RequestError } from '@/lib/request-security'
import { User as MongoUser } from '@/models'
import connectDB from '@/lib/mongodb'

export async function updateProfile(formData: FormData): Promise<{ success: boolean; message: string }> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return { success: false, message: 'Conectează-te pentru a continua.' }
  }

  const input = Object.fromEntries(
    ['firstName', 'lastName', 'userType', 'phone', 'institution', 'studyUnit', 'studyYear', 'city'].map(name => [name, formData.get(name)])
  )

  try {
    await limitRequests(clerkUser.id, 'profile-save')
    await saveProfile(clerkUser, input, { withDetails: true })

    // Revalidate the profile page to reflect changes
    revalidatePath('/dashboard/profile')
    revalidatePath('/payment')

    return { success: true, message: 'Profilul a fost actualizat cu succes!' }
  } catch (error) {
    // Returned, not thrown: production builds hide the message of a thrown error.
    if (error instanceof ProfileError || error instanceof RequestError) return { success: false, message: error.message }
    console.error('Error updating profile:', error)
    return { success: false, message: 'A apărut o eroare la actualizarea profilului.' }
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

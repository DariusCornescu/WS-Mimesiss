'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { updateAppSettings, resetAppSettings } from '@/lib/settings'
import { syncUserWithDatabase } from '@/lib/auth'

export async function updateSettings(formData: FormData) {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  try {
    // Extract form data
    const registrationStartTimeStr = formData.get('registrationStartTime') as string
    const registrationDeadlineStr = formData.get('registrationDeadline') as string
    
    // Helper to convert datetime-local input to a Date.
    // Returns undefined for empty input so Mongoose strips it from $set
    // (leaving the existing DB value untouched).
    const parseDateTime = (dateTimeStr: string): Date | undefined => {
      if (!dateTimeStr) return undefined
      return new Date(dateTimeStr + ':00.000Z')
    }
    
    const updates = {
      // Workshop settings
      globalRegistrationEnabled: formData.get('globalRegistrationEnabled') === 'on',
      paymentsEnabled: formData.get('paymentsEnabled') === 'on',
      workshopVisibleToPublic: formData.get('workshopVisibleToPublic') === 'on',
      allowCancelRegistration: formData.get('allowCancelRegistration') === 'on',
      registrationStartTime: parseDateTime(registrationStartTimeStr),
      registrationDeadline: parseDateTime(registrationDeadlineStr),
      defaultMaxParticipants: parseInt(formData.get('defaultMaxParticipants') as string) || 20,
      // Event mode and ball settings
      eventMode: (formData.get('eventMode') as string) === 'ball' ? 'ball' as const : 'workshops' as const,
      ballMaxTicketsPerUser: parseInt(formData.get('ballMaxTicketsPerUser') as string) || 2,
      ballTicketAvailableFrom: parseDateTime(formData.get('ballTicketAvailableFrom') as string),
      ballTicketAvailableTo: parseDateTime(formData.get('ballTicketAvailableTo') as string),
    }

    // Update settings
    await updateAppSettings(updates)

    // Revalidate pages that might use settings
    revalidatePath('/admin/settings')
    revalidatePath('/workshops')
    revalidatePath('/payment')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating settings:', error)
    throw new Error('Failed to update settings')
  }
}

export async function resetSettings() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  try {
    // Reset settings to defaults
    await resetAppSettings()

    // Revalidate pages that might use settings
    revalidatePath('/admin/settings')
    revalidatePath('/workshops')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error resetting settings:', error)
    throw new Error('Failed to reset settings')
  }
}

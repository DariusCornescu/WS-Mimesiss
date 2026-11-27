'use server'

import { revalidatePath } from 'next/cache'
import { updateAppSettings, resetAppSettings } from '@/lib/settings'
import { requireRole } from '@/lib/auth'
import { parseWith, settingsInput } from '@/lib/validation'
import { parseBucharestLocal } from '@/lib/bucharest-time'

export async function updateSettings(formData: FormData) {
  await requireRole('admin')

  try {
    // datetime-local inputs are Romanian wall-clock time. An empty field
    // clears the stored date (null), which is what the form's help text says.
    const parseDateTime = (name: string): Date | null => {
      const value = formData.get(name)
      if (typeof value !== 'string' || !value) return null
      const date = parseBucharestLocal(value)
      if (!date) throw new Error('Dată invalidă')
      return date
    }

    const updates = {
      // Workshop settings
      globalRegistrationEnabled: formData.get('globalRegistrationEnabled') === 'on',
      paymentsEnabled: formData.get('paymentsEnabled') === 'on',
      workshopVisibleToPublic: formData.get('workshopVisibleToPublic') === 'on',
      allowCancelRegistration: formData.get('allowCancelRegistration') === 'on',
      registrationStartTime: parseDateTime('registrationStartTime'),
      registrationDeadline: parseDateTime('registrationDeadline'),
      ticketSalesStartTime: parseDateTime('ticketSalesStartTime'),
      defaultMaxParticipants: parseInt(formData.get('defaultMaxParticipants') as string) || 20,
      // Event mode and ball settings
      eventMode: (formData.get('eventMode') as string) === 'ball' ? 'ball' as const : 'workshops' as const,
      ballMaxTicketsPerUser: parseInt(formData.get('ballMaxTicketsPerUser') as string) || 2,
      ballTicketAvailableFrom: parseDateTime('ballTicketAvailableFrom'),
      ballTicketAvailableTo: parseDateTime('ballTicketAvailableTo'),
      offerTicketId: (formData.get('offerTicketId') as string) || null,
      offerStartsAt: parseDateTime('offerStartsAt'),
      offerEndsAt: parseDateTime('offerEndsAt'),
    }

    const parsed = parseWith(settingsInput, updates)
    if (!parsed.ok) {
      // Returned, not thrown: production builds hide thrown action messages.
      return { success: false, error: parsed.error }
    }

    // Update settings
    await updateAppSettings(parsed.data)

    // Revalidate pages that might use settings
    revalidatePath('/admin/settings')
    revalidatePath('/congres/workshops')
    revalidatePath('/payment')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error updating settings:', error)
    throw new Error('Failed to update settings')
  }
}

export async function resetSettings() {
  await requireRole('admin')

  try {
    // Reset settings to defaults
    await resetAppSettings()

    // Revalidate pages that might use settings
    revalidatePath('/admin/settings')
    revalidatePath('/congres/workshops')
    revalidatePath('/')
    
    return { success: true }
  } catch (error) {
    console.error('Error resetting settings:', error)
    throw new Error('Failed to reset settings')
  }
}

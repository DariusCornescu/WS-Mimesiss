'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { syncUserWithDatabase } from '@/lib/auth'
import { limitRequests, RequestError } from '@/lib/request-security'
import { getUncachedAppSettings } from '@/lib/settings'
import { cancelPathChoice, registerUserForWorkshop } from '@/lib/registration'
import { pathChoiceOpen } from '@/lib/path-choice'
import { PATH_CHOICE_HREF } from '@/lib/path-project'
import { parseWith, registrationInput } from '@/lib/validation'

type ChoiceResult = { success: true } | { success: false; error: string }

/** Pick a PATH workshop, or give one up. Every rule is checked again here. */
export async function choosePathWorkshop(workshopId: string, action: 'register' | 'cancel'): Promise<ChoiceResult> {
  const clerkUser = await currentUser()
  if (!clerkUser) return { success: false, error: 'Trebuie să fii autentificat.' }
  await syncUserWithDatabase(clerkUser)

  const parsed = parseWith(registrationInput, { workshopId, action })
  if (!parsed.ok) return { success: false, error: parsed.error }

  try {
    await limitRequests(clerkUser.id, 'path-workshop-choice', 20)
    const settings = await getUncachedAppSettings()
    if (!pathChoiceOpen(settings)) return { success: false, error: 'Alegerea workshopurilor nu este deschisă în acest moment.' }

    if (parsed.data.action === 'register') {
      const result = await registerUserForWorkshop({
        userId: clerkUser.id,
        workshopId: parsed.data.workshopId,
        pathOnly: true,
        requireTicket: true,
        registrationStartTime: settings.registrationStartTime ? new Date(settings.registrationStartTime) : null,
        registrationDeadline: settings.registrationDeadline ? new Date(settings.registrationDeadline) : null,
      })
      if (!result.ok) return { success: false, error: result.message }
    } else {
      if (!settings.allowCancelRegistration) return { success: false, error: 'Alegerea nu mai poate fi schimbată.' }
      if (!(await cancelPathChoice(clerkUser.id, parsed.data.workshopId))) return { success: false, error: 'Nu există o alegere de anulat.' }
    }

    revalidatePath(PATH_CHOICE_HREF)
    revalidatePath('/dashboard/tickets')
    revalidatePath('/dashboard/registrations')
    return { success: true }
  } catch (error) {
    if (error instanceof RequestError) return { success: false, error: error.message }
    console.error('PATH workshop choice failed')
    return { success: false, error: 'A apărut o eroare. Te rugăm încearcă din nou.' }
  }
}

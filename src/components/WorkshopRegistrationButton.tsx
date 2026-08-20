'use client'

import type { Workshop } from '@/types/models'
import { useTransition } from 'react'
import { useToast } from '@/components/ui/ToastProvider'
import { registerForWorkshop } from '@/app/workshops/actions'
import { useMongoUser } from '@/hooks/useMongoUser'
import { useAppSettings } from '@/contexts/AppSettingsContext'
import Link from 'next/link'

interface WorkshopRegistrationButtonProps {
  workshop: Workshop
  onRegistrationChange?: () => Promise<void>
  onOptimisticUpdate?: (workshopId: string, isRegistered: boolean) => void
  isRegistered: boolean
}

// Simple CSS spinner component
function Spinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  )
}

export function WorkshopRegistrationButton({ workshop, onOptimisticUpdate, isRegistered }: WorkshopRegistrationButtonProps) {
  const { user: mongoUser, isLoading: isLoadingUser, error } = useMongoUser()
  const { globalRegistrationEnabled, registrationStartTime, registrationDeadline } = useAppSettings()
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  // Check registration timing
  const now = Date.now();
  const startTimestamp = registrationStartTime ? new Date(registrationStartTime).getTime() : null;
  const deadlineTimestamp = registrationDeadline ? new Date(registrationDeadline).getTime() : null;
  
  // Before start time affects ALL workshop types (workshops AND conferences)
  const isBeforeStart = startTimestamp && now < startTimestamp;
  
  // Deadline only affects workshops, NOT conferences
  const isWorkshop = workshop.wsType === 'workshop';
  const isAfterDeadline = isWorkshop && deadlineTimestamp && now > deadlineTimestamp;

  // Show loading state while user data is loading
  if (isLoadingUser) {
    return (
      <div className="w-full text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-md border border-gray-300">
        <Spinner /> Se încarcă...
      </div>
    )
  }

  // Show error state if user data failed to load
  if (error) {
    return (
      <div className="w-full text-center py-2 px-4 bg-red-100 text-red-600 rounded-md border border-red-300">
        Eroare la încărcarea datelor utilizatorului
      </div>
    )
  }

  // If no user is logged in, show a link to register or login
  if (!mongoUser) {
    return (
      <Link href="/auth/login" className="w-full font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
        Autentifică-te pentru a te înregistra
      </Link>
    )
  }

  // Check if workshop is full (conferences have unlimited capacity)
  const isConference = workshop.wsType === 'conferinta'
  const isFull = !isConference && workshop.currentParticipants >= workshop.maxParticipants

  // Show "registrations closed" if before start time (affects ALL types, even if already registered)
  if (isBeforeStart) {
    return (
      <div className="w-full text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-md border border-gray-300">
        Înregistrările sunt închise
      </div>
    )
  }

  // Show closed message if deadline has passed (ONLY for workshops, affects everyone)
  if (isAfterDeadline) {
    return (
      <div className="w-full text-center py-2 px-4 bg-destructive/10 text-destructive rounded-md border border-destructive">
        Înregistrările la workshop-uri s-au încheiat
      </div>
    )
  }

  async function handleSubmit(formData: FormData) {
    const action = formData.get('action') as string
    const willBeRegistered = action === 'register'
    const workshopId = String(workshop.id || workshop._id || '')

    // Optimistic update for instant visual feedback
    if (onOptimisticUpdate) {
      onOptimisticUpdate(workshopId, willBeRegistered)
    }

    startTransition(async () => {
      try {
        const result = await registerForWorkshop(formData)

        if (!result.success) {
          // Revert optimistic update on error
          if (onOptimisticUpdate) {
            onOptimisticUpdate(workshopId, !willBeRegistered)
          }
          showToast(result.error || 'A apărut o eroare. Te rugăm încearcă din nou.', 'error')
          return
        }

        // Show success message for immediate feedback
        if (isRegistered) {
          showToast('Te-ai dezînscris cu succes de la workshop', 'info')
        } else {
          showToast('Te-ai înscris cu succes la workshop!', 'success')
        }

        // No need to refresh - optimistic update already handled the UI

      } catch (error) {
        // Revert optimistic update on error
        if (onOptimisticUpdate) {
          onOptimisticUpdate(workshopId, !willBeRegistered)
        }

        // Handle specific error messages from the server
        const errorMessage = error instanceof Error ? error.message : 'A apărut o eroare. Te rugăm încearcă din nou.'
        showToast(errorMessage, 'error')
        console.error('Registration error:', error)
      }
    })
  }

  // Global registration toggle (affects all workshop types)
  if (!globalRegistrationEnabled) {
    return (
      <div className="w-full text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-md border border-gray-300">
        Înregistrările sunt închise
      </div>
    )
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="workshopId" value={workshop._id?.toString()} />
      <input
        type="hidden"
        name="action"
        value={isRegistered ? 'cancel' : 'register'}
      />
      <button
        type="submit"
        disabled={isPending || (isFull && !isRegistered)}
        className={`w-full font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2 ${isPending ? 'bg-gray-400 text-white cursor-wait' :
            isFull && !isRegistered
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : isRegistered
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
      >
        {isPending && <Spinner />}
        {isPending ? 'Se procesează...' :
          isFull && !isRegistered
            ? 'Workshop complet'
            : isRegistered
              ? 'Anulează înregistrarea'
              : 'Înregistrează-te acum'
        }
      </button>
    </form>
  )
}

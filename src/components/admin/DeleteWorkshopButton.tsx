'use client'

import { useState, useTransition } from 'react'
import { FaTrash } from 'react-icons/fa'
import { deleteWorkshop } from '@/app/admin/workshops/actions'

interface DeleteWorkshopButtonProps {
  workshopId: string
  workshopTitle: string
}

// Simple CSS spinner component
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
    />
  )
}

export default function DeleteWorkshopButton({ workshopId, workshopTitle }: DeleteWorkshopButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        setError('')
        await deleteWorkshop(workshopId)
        setShowConfirm(false)
      } catch (error) {
        console.error('Error deleting workshop:', error)
        setError(
          `Workshop-ul nu a putut fi șters: ${error instanceof Error ? error.message : 'eroare necunoscută'}`
        )
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="space-y-2">
        <div
          role="group"
          aria-labelledby={`delete-workshop-${workshopId}`}
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-3"
        >
          <p id={`delete-workshop-${workshopId}`} className="mb-3 text-sm text-foreground">
            Ștergi workshop-ul &bdquo;{workshopTitle}&rdquo;?
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type='button'
              onClick={handleDelete}
              disabled={isPending}
              aria-busy={isPending}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-transparent bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending && <Spinner />}
              {isPending ? 'Se șterge...' : 'Da, șterge'}
            </button>
            <button
              type='button'
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anulează
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="max-w-sm text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      type='button'
      onClick={() => {
        setError('')
        setShowConfirm(true)
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-destructive/50 bg-card px-3 py-2 text-sm font-medium leading-4 text-destructive shadow-sm transition-colors hover:bg-destructive/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <FaTrash aria-hidden="true" className="mr-2 h-4 w-4" />
      Șterge
    </button>
  )
}

'use client'

import { useState } from 'react'
import { FaTrash } from 'react-icons/fa'
import { removeUserFromWorkshop } from '@/app/admin/workshops/actions'
import { useRouter } from 'next/navigation'

interface RemoveUserButtonProps {
  userId: string
  workshopId: string
  userName: string
}

export function RemoveUserButton({ userId, workshopId, userName }: RemoveUserButtonProps) {
  const router = useRouter()
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState('')

  async function handleRemove() {
    if (!confirm(`Sigur doriți să eliminați utilizatorul "${userName}" de la acest workshop?`)) {
      return
    }

    setIsRemoving(true)
    setError('')

    try {
      const result = await removeUserFromWorkshop(userId, workshopId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'A apărut o eroare la eliminarea utilizatorului.')
      }
    } catch (error) {
      setError('A apărut o eroare neașteptată.')
      console.error('Error removing user:', error)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleRemove}
        disabled={isRemoving}
        aria-busy={isRemoving}
        aria-label={`Elimină utilizatorul ${userName} din workshop`}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        title="Elimină utilizatorul"
      >
        <FaTrash aria-hidden="true" className="h-4 w-4" />
      </button>
      {error && (
        <span role="alert" className="max-w-56 text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  )
}

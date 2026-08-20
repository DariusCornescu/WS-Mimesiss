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

  async function handleRemove() {
    if (!confirm(`Sigur doriți să eliminați utilizatorul "${userName}" de la acest workshop?`)) {
      return
    }

    setIsRemoving(true)

    try {
      const result = await removeUserFromWorkshop(userId, workshopId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || 'A apărut o eroare la eliminarea utilizatorului')
      }
    } catch (error) {
      alert('A apărut o eroare neașteptată')
      console.error('Error removing user:', error)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isRemoving}
      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Elimină utilizator"
    >
      <FaTrash className="h-4 w-4" />
    </button>
  )
}

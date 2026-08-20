'use client'

import { useState } from 'react'
import { FaTrash, FaSpinner } from 'react-icons/fa'
import { useRouter } from 'next/navigation'

interface DeletePaymentButtonProps {
  paymentId: string
  userName?: string
}

export default function DeletePaymentButton({ paymentId, userName }: DeletePaymentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const confirmMessage = userName 
      ? `Sigur doriți să ștergeți plata pentru ${userName}?`
      : 'Sigur doriți să ștergeți această plată?'
    
    if (!confirm(`${confirmMessage}\n\nAceastă acțiune nu poate fi anulată.`)) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/payments/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete payment')
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('A apărut o eroare la ștergerea plății. Vă rugăm să încercați din nou.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-md hover:bg-destructive/10 transition-colors"
      title="Șterge plata"
    >
      {isDeleting ? (
        <FaSpinner className="h-4 w-4 animate-spin" />
      ) : (
        <FaTrash className="h-4 w-4" />
      )}
    </button>
  )
}

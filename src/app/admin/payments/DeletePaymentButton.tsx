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
      aria-busy={isDeleting}
      aria-label={isDeleting ? 'Se șterge plata' : `Șterge plata${userName ? ` pentru ${userName}` : ''}`}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-50"
      title="Șterge plata"
    >
      {isDeleting ? (
        <FaSpinner aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <FaTrash aria-hidden="true" className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{isDeleting ? 'Se șterge…' : 'Șterge'}</span>
    </button>
  )
}

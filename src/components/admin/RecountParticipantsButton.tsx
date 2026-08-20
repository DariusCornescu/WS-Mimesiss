'use client'

import { useState } from 'react'
import { FaSync } from 'react-icons/fa'
import { recountAllWorkshopParticipants } from '@/app/admin/workshops/actions'

export default function RecountParticipantsButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleRecount = async () => {
    if (!confirm('Sigur doriți să recalculați numărul de participanți pentru toate workshop-urile?')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await recountAllWorkshopParticipants()

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Recalculare reușită!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Eroare la recalculare' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Eroare la recalculare' })
    } finally {
      setLoading(false)
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRecount}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaSync className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Se recalculează...' : 'Recalculează participanți'}
      </button>

      {message && (
        <div
          className={`text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

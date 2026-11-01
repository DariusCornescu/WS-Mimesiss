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
        aria-busy={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaSync aria-hidden="true" className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Se recalculează...' : 'Recalculează participanți'}
      </button>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'border-accent/40 bg-accent/10 text-foreground'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

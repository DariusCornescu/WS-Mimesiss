'use client'

import { useState, useTransition } from 'react'
import { FaCheck, FaUndo } from 'react-icons/fa'

interface TicketStatusToggleProps {
  ticketId: string
  initialStatus: 'active' | 'used' | 'cancelled'
  large?: boolean
  canReactivate?: boolean
}

export default function TicketStatusToggle({ ticketId, initialStatus, large, canReactivate = false }: TicketStatusToggleProps) {
  const [error, setError] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = status === 'used' ? 'active' : 'used'
    startTransition(async () => {
      setError('')
      try {
      const res = await fetch('/api/admin/tickets/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Nu am putut actualiza biletul.')
      setStatus(data.ticket.status)
      } catch (err) { setError(err instanceof Error ? err.message : 'Nu am putut actualiza biletul.') }
    })
  }

  return (
    <div>
    <button
      type="button"
      onClick={toggle}
      disabled={isPending || status === 'cancelled' || (status === 'used' && !canReactivate)}
      aria-busy={isPending}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${large ? 'w-full px-4 py-3 text-sm' : 'px-3 py-1.5 text-xs'} ${
        status === 'used'
          ? 'bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20'
          : status === 'cancelled'
          ? 'bg-destructive/10 text-destructive border border-destructive/30'
          : 'bg-muted text-muted-foreground border border-border hover:bg-accent/10 hover:text-accent'
      }`}
    >
      {isPending ? (
        <span className="h-3 w-3 animate-spin rounded-full border border-current border-r-transparent" aria-hidden="true" />
      ) : status === 'used' ? (
        <>
          <FaCheck className="h-3 w-3" aria-hidden="true" />
          Folosit
          {canReactivate && <FaUndo className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />}
        </>
      ) : status === 'cancelled' ? (
        'Anulat'
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          Marchează folosit
        </>
      )}
    </button>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}

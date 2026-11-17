'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FaCheck, FaUndo } from 'react-icons/fa'

interface TicketStatusToggleProps {
  ticketId: string
  initialStatus: 'active' | 'used' | 'cancelled'
  /** Entries the ticket allows and how many were confirmed; a single-use ticket allows 1. */
  allowed?: number
  initialUsed?: number
  large?: boolean
  canReactivate?: boolean
}

/**
 * Confirms entries on a ticket. A single-use ticket is marked used; a ticket
 * with several entries (one per workshop) counts down and shows what is left.
 * Admins can give the last entry back.
 */
export default function TicketStatusToggle({ ticketId, initialStatus, allowed: initialAllowed = 1, initialUsed, large, canReactivate = false }: TicketStatusToggleProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [status, setStatus] = useState(initialStatus)
  const [allowed, setAllowed] = useState(initialAllowed)
  const [used, setUsed] = useState(initialUsed ?? (initialStatus === 'used' ? initialAllowed : 0))
  const [isPending, startTransition] = useTransition()

  const cancelled = status === 'cancelled'
  const multiple = allowed > 1
  const remaining = cancelled ? 0 : Math.max(0, allowed - used)
  const full = !cancelled && remaining === 0

  const send = (next: 'used' | 'active') => {
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
        if (data.entries) {
          setAllowed(data.entries.allowed)
          setUsed(data.entries.used)
        }
        // Keeps the server-rendered status and counters around the button current.
        router.refresh()
      } catch (err) { setError(err instanceof Error ? err.message : 'Nu am putut actualiza biletul.') }
    })
  }

  const size = large ? 'w-full px-4 py-3 text-sm' : 'px-3 py-1.5 text-xs'
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <div>
      {multiple && !cancelled && (
        <p className={`text-muted-foreground ${large ? 'mb-3 text-sm' : 'mb-1.5 text-xs'}`} aria-live="polite">
          Intrări rămase: <strong className={remaining > 0 ? 'text-accent' : 'text-foreground'}>{remaining}</strong> din {allowed}
        </p>
      )}
      <button
        type="button"
        onClick={() => send(full ? 'active' : 'used')}
        disabled={isPending || cancelled || (full && !canReactivate)}
        aria-busy={isPending}
        className={`${base} ${size} ${
          full
            ? 'bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20'
            : cancelled
            ? 'bg-destructive/10 text-destructive border border-destructive/30'
            : 'bg-muted text-muted-foreground border border-border hover:bg-accent/10 hover:text-accent'
        }`}
      >
        {isPending ? (
          <span className="h-3 w-3 animate-spin rounded-full border border-current border-r-transparent" aria-hidden="true" />
        ) : full ? (
          <>
            <FaCheck className="h-3 w-3" aria-hidden="true" />
            {multiple ? 'Toate intrările folosite' : 'Folosit'}
            {canReactivate && <FaUndo className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />}
          </>
        ) : cancelled ? (
          'Anulat'
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {multiple ? 'Confirmă intrarea' : 'Marchează folosit'}
          </>
        )}
      </button>
      {multiple && canReactivate && !cancelled && !full && used > 0 && (
        <button
          type="button"
          onClick={() => send('active')}
          disabled={isPending}
          className={`${base} ${large ? 'mt-2 w-full px-4 py-2 text-xs' : 'ml-2 px-2 py-1.5 text-xs'} border border-border text-muted-foreground hover:text-foreground`}
        >
          <FaUndo className="h-2.5 w-2.5" aria-hidden="true" />
          Anulează ultima intrare
        </button>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  )
}

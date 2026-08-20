'use client'

import { useState, useTransition } from 'react'
import { FaCheck, FaUndo } from 'react-icons/fa'

interface TicketStatusToggleProps {
  ticketId: string
  initialStatus: 'active' | 'used' | 'cancelled'
  large?: boolean
}

export default function TicketStatusToggle({ ticketId, initialStatus, large }: TicketStatusToggleProps) {
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()

  const toggle = () => {
    const next = status === 'used' ? 'active' : 'used'
    startTransition(async () => {
      const res = await fetch('/api/admin/tickets/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status: next }),
      })
      if (res.ok) setStatus(next)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending || status === 'cancelled'}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${large ? 'w-full px-4 py-3 text-sm' : 'px-3 py-1.5 text-xs'} ${
        status === 'used'
          ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
          : status === 'cancelled'
          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
          : 'bg-muted text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {isPending ? (
        <div className="h-3 w-3 animate-spin rounded-full border border-current border-r-transparent" />
      ) : status === 'used' ? (
        <>
          <FaCheck className="h-3 w-3" />
          Folosit
          <FaUndo className="h-2.5 w-2.5 opacity-60" />
        </>
      ) : status === 'cancelled' ? (
        'Anulat'
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-primary" />
          Marchează folosit
        </>
      )}
    </button>
  )
}

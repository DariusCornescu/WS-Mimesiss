'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaCheck, FaTicketSimple } from 'react-icons/fa6'
import type { Ticket } from '@/types/models'
import { deleteTicket } from './actions'

interface TicketCardProps {
  ticket: Ticket
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const ticketTitleId = useId()
  const confirmTitleId = useId()
  const confirmPanelId = useId()
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()
  const ticketId = ticket._id || ticket.id || ''

  useEffect(() => {
    if (isConfirmingDelete) {
      confirmButtonRef.current?.focus()
    }
  }, [isConfirmingDelete])

  const handleDelete = async () => {
    setIsDeleting(true)
    setError('')

    try {
      await deleteTicket(ticketId)
      router.refresh()
    } catch (caughtError) {
      console.error('Error deleting ticket:', caughtError)
      setError('Biletul nu a putut fi șters. Încearcă din nou.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false)
    setError('')
    requestAnimationFrame(() => deleteButtonRef.current?.focus())
  }

  return (
    <article
      aria-labelledby={ticketTitleId}
      className="flex h-full flex-col rounded-xl border border-border/60 bg-card/90 p-5 shadow-lg shadow-background/10 transition-colors hover:border-accent/30 sm:p-6"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={ticketTitleId} className="break-words text-xl font-semibold text-foreground">
              {ticket.title || 'Fără titlu'}
            </h3>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                ticket.enabled !== false
                  ? 'border-secondary/35 bg-secondary/10 text-secondary'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {ticket.enabled !== false ? 'Activ' : 'Dezactivat'}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold text-accent">{ticket.price} RON</p>
        </div>
        <span className="grid h-11 w-11 flex-none place-items-center rounded-full border border-accent/20 bg-accent/10 text-accent">
          <FaTicketSimple aria-hidden="true" className="h-5 w-5" />
        </span>
      </header>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {ticket.description || 'Fără descriere.'}
      </p>

      <div className="mt-5 flex-1">
        <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
          Caracteristici
        </h4>
        {ticket.features.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {ticket.features.map((feature, index) => (
              <li key={`${feature}-${index}`} className="flex items-start text-sm leading-5 text-muted-foreground">
                <FaCheck aria-hidden="true" className="mr-2 mt-0.5 h-4 w-4 flex-none text-accent" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nu sunt definite caracteristici.</p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
        <Link
          href={`/admin/tickets/${ticketId}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Editează
        </Link>
        <button
          ref={deleteButtonRef}
          type="button"
          onClick={() => {
            setError('')
            setIsConfirmingDelete(true)
          }}
          disabled={isDeleting || isConfirmingDelete}
          aria-expanded={isConfirmingDelete}
          aria-controls={isConfirmingDelete ? confirmPanelId : undefined}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          Șterge
        </button>
      </div>

      {isConfirmingDelete && (
        <div
          id={confirmPanelId}
          role="group"
          aria-labelledby={confirmTitleId}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isDeleting) {
              handleCancelDelete()
            }
          }}
          className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4"
        >
          <p id={confirmTitleId} className="text-sm font-medium text-foreground">
            Ștergi biletul &bdquo;{ticket.title || 'Fără titlu'}&rdquo;?
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Acțiunea este permanentă și nu poate fi anulată.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-busy={isDeleting}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? 'Se șterge…' : 'Da, șterge'}
            </button>
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anulează
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

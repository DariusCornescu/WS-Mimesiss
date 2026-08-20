'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Ticket } from '@/types/models'
import { deleteTicket } from './actions'
import { FaTicketSimple,FaCheck } from 'react-icons/fa6'

interface TicketCardProps {
  ticket: Ticket
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Sigur doriți să ștergeți acest bilet?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteTicket(ticket._id || ticket.id || '')
      console.log('Delete ticket:', ticket._id || ticket.id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      alert('A apărut o eroare la ștergerea biletului')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mimesiss-section-card hover:shadow-lg transition-shadow duration-200">
      <div className="p-6 flex flex-col h-full">
        {/* Ticket Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-foreground">
                {ticket.title || 'Fără titlu'}
              </h3>
              <span 
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  ticket.enabled !== false 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-gray-500/10 text-gray-500'
                }`}
              >
                {ticket.enabled !== false ? 'Activ' : 'Dezactivat'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {ticket.price} RON
              </span>
            </div>
          </div>
          <FaTicketSimple className="w-8 h-8 text-primary/20" />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ticket.description}
        </p>

        {/* Features */}
        <div className="flex-1 mb-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
            Caracteristici
          </h4>
          <ul className="space-y-1">
            {ticket.features.map((feature) => (
              <li 
                key={feature} 
                className="text-sm text-muted-foreground flex items-start"
              >
                <FaCheck className="w-4 h-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-border flex gap-2">
          <Link 
            href={`/admin/tickets/${ticket._id || ticket.id}`} 
            className="flex-1 text-center bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 px-4 rounded-md transition duration-200 text-sm"
          >
            Editează
          </Link>
          <button 
            type="button"
            className="flex-1 text-center bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium py-2 px-4 rounded-md transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Se șterge...' : 'Șterge'}
          </button>
        </div>
      </div>
    </div>
  )
}

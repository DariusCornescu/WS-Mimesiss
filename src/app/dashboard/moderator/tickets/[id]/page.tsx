import { notFound } from 'next/navigation'
import { requireRoleOrRedirect } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'
import type { IUser } from '@/models'
import { FaArrowLeft, FaTicketAlt, FaCalendar, FaUser, FaEnvelope } from 'react-icons/fa'
import Link from 'next/link'
import mongoose from 'mongoose'
import TicketStatusToggle from '@/components/moderator/TicketStatusToggle'
import { entriesForTickets } from '@/lib/ticket-entitlements'
import { ticketEntries, workshopsLabel } from '@/lib/ticket-entries'

export const dynamic = 'force-dynamic'

export default async function ModeratorTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const staff = await requireRoleOrRedirect('admin', 'moderator')

  if (!mongoose.isValidObjectId(id)) notFound()

  await connectDB()

  const ticket = await IssuedTicket.findById(id).lean()
  if (!ticket) notFound()

  const owner = await User.findOne({ clerkId: ticket.clerkId }).lean() as IUser | null
  const displayName = owner
    ? owner.firstName && owner.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : owner.email
    : ticket.clerkId

  const entries = (await entriesForTickets([ticket])).get(String(ticket._id)) ?? ticketEntries(ticket, null)
  const workshops = workshopsLabel(entries)
  const full = ticket.status !== 'cancelled' && entries.remaining === 0

  const statusColor =
    full
      ? 'text-secondary bg-secondary/10 border-secondary/30'
      : ticket.status === 'cancelled'
      ? 'text-destructive bg-destructive/10 border-destructive/30'
      : 'text-accent bg-primary/10 border-primary/30'

  const statusLabel =
    full ? 'Folosit' : ticket.status === 'cancelled' ? 'Anulat' : 'Activ'

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/moderator/scan"
          aria-label="Înapoi la scanarea biletelor"
          className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <FaArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Detalii bilet</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Validare la intrare</p>
        </div>
      </div>

      {/* Ticket card */}
      <div className="mimesiss-card p-6 space-y-5">
        {/* Number + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaTicketAlt className="h-5 w-5 text-accent" />
            <span className="font-mono text-2xl font-bold text-accent tracking-wide">
              #{String(ticket.ticketNumber).padStart(4, '0')}
            </span>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        {/* Title */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Bilet</p>
          <p className="text-base font-semibold text-foreground">{ticket.ticketTitle}</p>
          <p className="text-xs text-muted-foreground capitalize mt-0.5">{ticket.category}</p>
          {workshops && (
            <p className={`mt-3 rounded-md border px-3 py-2 text-sm font-semibold ${entries.extraWorkshops > 0 ? 'border-accent/40 bg-accent/10 text-accent' : 'border-border bg-muted/40 text-foreground'}`}>
              {entries.extraWorkshops > 0 ? `Include workshop suplimentar: ${workshops}` : workshops}
            </p>
          )}
        </div>

        <hr className="border-border" />

        {/* Owner */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Deținător</p>
          <div className="flex items-center gap-2 text-foreground">
            <FaUser className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{displayName}</span>
          </div>
          {owner?.email && owner.email !== displayName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FaEnvelope className="h-3.5 w-3.5 shrink-0" />
              <span className="text-sm">{owner.email}</span>
            </div>
          )}
        </div>

        <hr className="border-border" />

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FaCalendar className="h-3.5 w-3.5 shrink-0" />
          <span>
            Emis la{' '}
            {new Date(ticket.createdAt).toLocaleDateString('ro-RO', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Status toggle */}
      {ticket.status !== 'cancelled' && (
        <div className="mimesiss-card p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {entries.allowed > 1
              ? full
                ? 'Toate intrările acestui bilet au fost folosite. Un administrator poate anula ultima intrare dacă a fost o greșeală.'
                : 'Confirmați câte o intrare la fiecare workshop. Biletul nu mai poate fi folosit după ultima intrare.'
              : full
              ? 'Biletul a fost deja marcat ca folosit. Puteți reactiva dacă a fost o greșeală.'
              : 'Marchați biletul ca folosit la intrarea participantului.'}
          </p>
          <TicketStatusToggle canReactivate={staff.role === 'admin'}
            ticketId={(ticket._id as { toString(): string }).toString()}
            initialStatus={ticket.status as 'active' | 'used' | 'cancelled'}
            allowed={entries.allowed}
            initialUsed={entries.used}
            large
          />
        </div>
      )}

      {ticket.status === 'cancelled' && (
        <div role="alert" className="mimesiss-card border border-destructive/30 p-4">
          <p className="text-center text-sm text-destructive">Acest bilet a fost anulat și nu este valid.</p>
        </div>
      )}
    </div>
  )
}

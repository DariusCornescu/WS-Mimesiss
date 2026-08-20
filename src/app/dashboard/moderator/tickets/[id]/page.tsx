import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'
import type { IUser } from '@/models'
import type { User as UserType } from '@/types/models'
import { FaArrowLeft, FaTicketAlt, FaCalendar, FaUser, FaEnvelope } from 'react-icons/fa'
import Link from 'next/link'
import mongoose from 'mongoose'
import TicketStatusToggle from '@/components/moderator/TicketStatusToggle'

export const dynamic = 'force-dynamic'

export default async function ModeratorTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/auth/login')

  const user: UserType = await syncUserWithDatabase(clerkUser)
  if (user.role !== 'moderator' && user.role !== 'admin') redirect('/unauthorized')

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

  const statusColor =
    ticket.status === 'used'
      ? 'text-green-400 bg-green-500/10 border-green-500/30'
      : ticket.status === 'cancelled'
      ? 'text-red-400 bg-red-500/10 border-red-500/30'
      : 'text-primary bg-primary/10 border-primary/30'

  const statusLabel =
    ticket.status === 'used' ? 'Folosit' : ticket.status === 'cancelled' ? 'Anulat' : 'Activ'

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/moderator/scan"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <FaArrowLeft className="h-4 w-4" />
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
            <FaTicketAlt className="h-5 w-5 text-primary" />
            <span className="font-mono text-2xl font-bold text-primary tracking-wide">
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
            {ticket.status === 'active'
              ? 'Marchați biletul ca folosit la intrarea participantului.'
              : 'Biletul a fost deja marcat ca folosit. Puteți reactiva dacă a fost o greșeală.'}
          </p>
          <TicketStatusToggle
            ticketId={(ticket._id as { toString(): string }).toString()}
            initialStatus={ticket.status as 'active' | 'used' | 'cancelled'}
            large
          />
        </div>
      )}

      {ticket.status === 'cancelled' && (
        <div className="mimesiss-card p-4 border border-red-500/30">
          <p className="text-sm text-red-400 text-center">Acest bilet a fost anulat și nu este valid.</p>
        </div>
      )}
    </div>
  )
}

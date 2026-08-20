import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'
import type { User as UserType } from '@/types/models'
import { FaTicketAlt, FaCalendar, FaSearch } from 'react-icons/fa'
import TicketStatusToggle from '@/components/moderator/TicketStatusToggle'

export const dynamic = 'force-dynamic'

export default async function ModeratorTicketsPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/auth/login')

  const user: UserType = await syncUserWithDatabase(clerkUser)
  if (user.role !== 'moderator' && user.role !== 'admin') redirect('/unauthorized')

  await connectDB()

  // Fetch all issued tickets sorted by ticket number
  const tickets = await IssuedTicket.find({}).sort({ ticketNumber: 1 }).lean()

  // Fetch all users referenced by these tickets in one query
  const clerkIds = [...new Set(tickets.map((t) => t.clerkId))]
  const users = await User.find({ clerkId: { $in: clerkIds } }).lean()
  const userMap = new Map(users.map((u) => [u.clerkId, u]))

  const total = tickets.length
  const used = tickets.filter((t) => t.status === 'used').length
  const active = tickets.filter((t) => t.status === 'active').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bilete emise</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestionați statusul biletelor la intrare
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="mimesiss-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </div>
        <div className="mimesiss-card p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{used}</div>
          <div className="text-xs text-muted-foreground mt-1">Folosite</div>
        </div>
        <div className="mimesiss-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{active}</div>
          <div className="text-xs text-muted-foreground mt-1">Active</div>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 mimesiss-section-card">
          <FaTicketAlt className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground">Nu există bilete emise</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Biletele vor apărea aici după ce utilizatorii le achiziționează.
          </p>
        </div>
      ) : (
        <div className="mimesiss-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bilet</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Utilizator</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => {
                  const owner = userMap.get(ticket.clerkId)
                  const displayName = owner
                    ? (owner.firstName && owner.lastName
                        ? `${owner.firstName} ${owner.lastName}`
                        : owner.email)
                    : ticket.clerkId

                  return (
                    <tr key={(ticket._id as { toString(): string }).toString()} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-primary font-semibold">
                        #{String(ticket.ticketNumber).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{ticket.ticketTitle}</div>
                        <div className="text-xs text-muted-foreground capitalize">{ticket.category}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{displayName}</div>
                        {owner && owner.email !== displayName && (
                          <div className="text-xs text-muted-foreground">{owner.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                          <FaCalendar className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString('ro-RO', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TicketStatusToggle
                          ticketId={(ticket._id as { toString(): string }).toString()}
                          initialStatus={ticket.status as 'active' | 'used' | 'cancelled'}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

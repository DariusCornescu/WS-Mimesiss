import mongoose from 'mongoose'
import { Ticket } from '@/models'
import { MAX_WORKSHOPS_PER_USER, workshopEntitlements } from '@/lib/registration'
import { ticketEntries, type TicketEntries } from '@/lib/ticket-entries'

interface IssuedTicketLike {
  _id: unknown
  clerkId: string
  ticketTypeId: string
  status: string
  entriesUsed?: number | null
}

export interface CoveredWorkshops {
  /** Null for a ticket whose product gives no workshop access. */
  workshops: number | null
  extraWorkshops: number
}

/**
 * Workshops each issued ticket covers: the base number for a product with
 * workshop access, plus the owner's add-on places. Keyed by ticket id.
 * Callers must `await connectDB()` first.
 */
export async function workshopsForTickets(tickets: IssuedTicketLike[]): Promise<Map<string, CoveredWorkshops>> {
  const productIds = [...new Set(tickets.map(ticket => ticket.ticketTypeId).filter(id => mongoose.isValidObjectId(id)))]
  const granting = productIds.length === 0 ? [] : await Ticket.find({ _id: { $in: productIds }, workshopAccess: true }).select('_id').lean()
  const grantingIds = new Set(granting.map(product => String(product._id)))
  const owners = [...new Set(tickets.filter(ticket => grantingIds.has(ticket.ticketTypeId)).map(ticket => ticket.clerkId))]
  const entitlements = await workshopEntitlements(owners)
  return new Map(tickets.map((ticket): [string, CoveredWorkshops] => {
    if (!grantingIds.has(ticket.ticketTypeId)) return [String(ticket._id), { workshops: null, extraWorkshops: 0 }]
    const extraWorkshops = entitlements.get(ticket.clerkId)?.extraPlaces ?? 0
    return [String(ticket._id), { workshops: MAX_WORKSHOPS_PER_USER + extraWorkshops, extraWorkshops }]
  }))
}

/** Entries allowed, used and remaining for each issued ticket, keyed by ticket id. */
export async function entriesForTickets(tickets: IssuedTicketLike[]): Promise<Map<string, TicketEntries>> {
  const covered = await workshopsForTickets(tickets)
  return new Map(tickets.map((ticket): [string, TicketEntries] => {
    const id = String(ticket._id)
    const { workshops, extraWorkshops } = covered.get(id) ?? { workshops: null, extraWorkshops: 0 }
    return [id, ticketEntries(ticket, workshops, extraWorkshops)]
  }))
}

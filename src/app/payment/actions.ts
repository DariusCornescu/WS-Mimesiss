'use server'

import { Ticket as TicketType } from '@/types/models'
import { Ticket } from '@/models'
import connectDB from '@/lib/mongodb'
import { ticketsTaken, remainingStock } from '@/lib/ticket-stock'

/**
 * Public read for the payment-page selectors: only enabled tickets, only the
 * fields the UI needs. The admin CRUD lives in admin/tickets/actions.ts
 * behind requireRole('admin') — do not import it from public components.
 */
export async function getPublicTickets(): Promise<TicketType[]> {
  await connectDB()

  const tickets = await Ticket.find({ enabled: true })
    .select('title description price features type enabled category maxQuantity')
    .lean()

  // Convert to plain objects to ensure serializability. The stock figures
  // stay server-side; buyers only learn whether a ticket is sold out.
  const plain = JSON.parse(JSON.stringify(tickets)) as TicketType[]
  const taken = await ticketsTaken(plain.map(ticket => String(ticket._id)))
  return plain.map(({ maxQuantity, ...ticket }) => ({
    ...ticket,
    soldOut: remainingStock(maxQuantity, taken.get(String(ticket._id)) ?? 0) === 0,
  }))
}

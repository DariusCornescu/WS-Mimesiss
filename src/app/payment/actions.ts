'use server'

import { Ticket as TicketType } from '@/types/models'
import { Ticket } from '@/models'
import connectDB from '@/lib/mongodb'

/**
 * Public read for the payment-page selectors: only enabled tickets, only the
 * fields the UI needs. The admin CRUD lives in admin/tickets/actions.ts
 * behind requireRole('admin') — do not import it from public components.
 */
export async function getPublicTickets(): Promise<TicketType[]> {
  await connectDB()

  const tickets = await Ticket.find({ enabled: true })
    .select('title description price features type enabled category')
    .lean()

  // Convert to plain objects to ensure serializability
  return JSON.parse(JSON.stringify(tickets)) as TicketType[]
}

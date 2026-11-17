'use server'

import { auth } from '@clerk/nextjs/server'
import { Ticket as TicketType } from '@/types/models'
import { Ticket } from '@/models'
import connectDB from '@/lib/mongodb'
import { ticketsTaken, remainingStock } from '@/lib/ticket-stock'
import { holdsWorkshopTicket } from '@/lib/registration'

/**
 * Public read for the payment-page selectors: only enabled tickets, only the
 * fields the UI needs. The admin CRUD lives in admin/tickets/actions.ts
 * behind requireRole('admin') — do not import it from public components.
 */
export async function getPublicTickets(): Promise<TicketType[]> {
  await connectDB()

  const tickets = await Ticket.find({ enabled: true })
    .select('title description price features type enabled category maxQuantity workshopAccess extraWorkshops')
    .lean()

  // Convert to plain objects to ensure serializability. The stock figures
  // stay server-side; buyers only learn whether a ticket is sold out.
  const plain = JSON.parse(JSON.stringify(tickets)) as TicketType[]
  const taken = await ticketsTaken(plain.map(ticket => String(ticket._id)))

  // Add-ons are sold only next to a workshop ticket. The server enforces this
  // again when the payment is reserved; here it only shapes the button.
  let canBuyAddOns = false
  if (plain.some(ticket => (ticket.extraWorkshops ?? 0) > 0)) {
    const { userId } = await auth()
    canBuyAddOns = userId ? await holdsWorkshopTicket(userId) : false
  }

  return plain.map(({ maxQuantity, ...ticket }) => ({
    ...ticket,
    soldOut: remainingStock(maxQuantity, taken.get(String(ticket._id)) ?? 0) === 0,
    requiresBaseTicket: (ticket.extraWorkshops ?? 0) > 0 && !canBuyAddOns,
  }))
}

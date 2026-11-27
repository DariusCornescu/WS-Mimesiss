'use server'

import { auth } from '@clerk/nextjs/server'
import { Ticket as TicketType } from '@/types/models'
import { Ticket } from '@/models'
import connectDB from '@/lib/mongodb'
import { ticketsTaken, remainingStock } from '@/lib/ticket-stock'
import { workshopEntitlements } from '@/lib/registration'
import { getAppSettings } from '@/lib/settings'
import { isAddOnProduct } from '@/lib/ticket-products'
import { limitedOffer, offerAllows } from '@/lib/payment-policy'

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

  // A limited offer decides which workshop tickets are on sale right now.
  // The server checks the same window again when the payment is reserved.
  const settings = await getAppSettings()
  const offer = limitedOffer(settings)
  const onSale = tickets.filter(ticket => ticket.category !== 'workshop' || offerAllows(String(ticket._id), settings))

  // Convert to plain objects to ensure serializability. The stock figures
  // stay server-side; buyers only learn whether a ticket is sold out.
  const plain = JSON.parse(JSON.stringify(onSale)) as TicketType[]
  const taken = await ticketsTaken(plain.map(ticket => String(ticket._id)))

  // Add-ons are sold only next to a workshop ticket, and only to someone who
  // has no extra place yet. The server enforces this again when the payment
  // is reserved; here it only shapes the button.
  let canBuyAddOns = false
  if (plain.some(isAddOnProduct)) {
    const { userId } = await auth()
    const entitlement = userId ? (await workshopEntitlements([userId])).get(userId) : undefined
    canBuyAddOns = Boolean(entitlement?.holdsTicket && entitlement.extraPlaces === 0)
  }

  return plain.map(({ maxQuantity, ...ticket }) => ({
    ...ticket,
    soldOut: remainingStock(maxQuantity, taken.get(String(ticket._id)) ?? 0) === 0,
    requiresBaseTicket: isAddOnProduct(ticket) && !canBuyAddOns,
    offerEndsAt: offer?.active && offer.ticketId === String(ticket._id) ? offer.endsAt : null,
  }))
}

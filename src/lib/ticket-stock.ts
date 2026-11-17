import type { ClientSession } from 'mongoose'
import { Payment } from '@/models'
import { PaymentAttempt } from '@/models/PaymentAttempt'

/**
 * How many units of each ticket are no longer for sale: paid ones plus those
 * held by a checkout that is still open. Derived from the payment records
 * rather than kept as a counter, so refunds, manual payments and cancelled
 * checkouts are reflected without any bookkeeping of their own.
 * Callers must `await connectDB()` first.
 */
export async function ticketsTaken(ticketIds: string[], session?: ClientSession): Promise<Map<string, number>> {
  const taken = new Map<string, number>(ticketIds.map(id => [id, 0]))
  if (ticketIds.length === 0) return taken
  const sum = [{ $group: { _id: '$ticketId', units: { $sum: { $ifNull: ['$quantity', 1] } } } }]
  const paid = Payment.aggregate<{ _id: string; units: number }>([{ $match: { ticketId: { $in: ticketIds }, status: 'completed' } }, ...sum])
  const held = PaymentAttempt.aggregate<{ _id: string; units: number }>([{ $match: { ticketId: { $in: ticketIds }, status: 'pending' } }, ...sum])
  // An add-on bought together with a ticket is one held unit of the add-on.
  const heldAddOns = PaymentAttempt.aggregate<{ _id: string; units: number }>([
    { $match: { addOnTicketId: { $in: ticketIds }, status: 'pending' } },
    { $group: { _id: '$addOnTicketId', units: { $sum: 1 } } },
  ])
  if (session) { paid.session(session); held.session(session); heldAddOns.session(session) }
  // Sequential: one session cannot run two operations at once.
  for (const row of [...await paid, ...await held, ...await heldAddOns]) taken.set(row._id, (taken.get(row._id) ?? 0) + row.units)
  return taken
}

/** Units left for a ticket; null when its stock is unlimited. */
export function remainingStock(maxQuantity: number | null | undefined, taken: number): number | null {
  return typeof maxQuantity === 'number' ? Math.max(0, maxQuantity - taken) : null
}

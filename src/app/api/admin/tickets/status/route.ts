import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { IssuedTicket } from '@/models'
import { parseWith, issuedTicketStatusInput } from '@/lib/validation'
import { workshopsForTickets } from '@/lib/ticket-entitlements'
import { ticketEntries } from '@/lib/ticket-entries'

/**
 * `used` confirms one entry. A ticket with workshop access has one entry per
 * workshop it covers and turns `used` when the last one is taken; every other
 * ticket is single use. `active` (admins) gives the last entry back, or
 * reactivates a cancelled ticket. `cancelled` (admins) cancels it.
 */
export async function PATCH(req: NextRequest) {
  try {
    const staff = await requireRole('admin', 'moderator')

    const parsed = parseWith(issuedTicketStatusInput, await req.json())

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { ticketId, status } = parsed.data

    if (status !== 'used' && staff.role !== 'admin') return NextResponse.json({ error: 'Doar administratorul poate reactiva sau anula un bilet.' }, { status: 403 })

    const current = await IssuedTicket.findById(ticketId).lean()
    if (!current) return NextResponse.json({ error: 'Biletul nu este activ sau a fost deja folosit.' }, { status: 409 })
    const covered = (await workshopsForTickets([current])).get(String(current._id)) ?? { workshops: null, extraWorkshops: 0 }
    const allowed = ticketEntries(current, covered.workshops, covered.extraWorkshops).allowed

    let ticket
    if (status === 'used') {
      // The count is checked in the filter, so concurrent scans can never
      // confirm more entries than the ticket allows.
      ticket = await IssuedTicket.findOneAndUpdate(
        { _id: ticketId, $or: [
          { status: 'active', entriesUsed: { $exists: false } },
          { status: { $in: ['active', 'used'] }, entriesUsed: { $lt: allowed } },
        ] },
        { $inc: { entriesUsed: 1 } },
        { new: true }
      )
      if (!ticket) {
        const error = current.status === 'cancelled' ? 'Biletul este anulat.'
          : allowed > 1 ? 'Biletul nu mai are intrări disponibile.'
          : 'Biletul nu este activ sau a fost deja folosit.'
        return NextResponse.json({ error }, { status: 409 })
      }
      const next = (ticket.entriesUsed ?? 0) >= allowed ? 'used' : 'active'
      if (ticket.status !== next) {
        await IssuedTicket.updateOne({ _id: ticketId, status: { $ne: 'cancelled' } }, { $set: { status: next } })
        ticket.status = next
      }
    } else if (status === 'active') {
      ticket = await IssuedTicket.findOneAndUpdate(
        { _id: ticketId, status: { $ne: 'cancelled' }, entriesUsed: { $gt: 0 } },
        { $inc: { entriesUsed: -1 }, $set: { status: 'active' } },
        { new: true }
      ) ?? await IssuedTicket.findOneAndUpdate({ _id: ticketId }, { $set: { status: 'active' } }, { new: true })
    } else {
      ticket = await IssuedTicket.findOneAndUpdate({ _id: ticketId }, { $set: { status } }, { new: true })
    }

    if (!ticket) return NextResponse.json({ error: 'Biletul nu este activ sau a fost deja folosit.' }, { status: 409 })

    return NextResponse.json({ success: true, ticket, entries: ticketEntries(ticket, covered.workshops, covered.extraWorkshops) })
  } catch (error) {
    const authResponse = toAuthResponse(error)
    if (authResponse) return authResponse

    console.error('Error updating ticket status:', error)
    return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 })
  }
}

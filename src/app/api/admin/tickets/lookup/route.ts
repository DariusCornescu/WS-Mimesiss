import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'
import type { IUser } from '@/models'
import { entriesForTickets } from '@/lib/ticket-entitlements'
import { ticketEntries, workshopsLabel } from '@/lib/ticket-entries'

export async function GET(req: NextRequest) {
  try {
    await requireRole('admin', 'moderator')
  } catch (error) {
    const authResponse = toAuthResponse(error)
    if (authResponse) return authResponse
    throw error
  }

  const ticketNumber = req.nextUrl.searchParams.get('number')
  if (!ticketNumber || isNaN(Number(ticketNumber))) {
    return NextResponse.json({ error: 'Invalid ticket number' }, { status: 400 })
  }

  await connectDB()

  const ticket = await IssuedTicket.findOne({ ticketNumber: Number(ticketNumber) }).lean()
  if (!ticket) return NextResponse.json({ error: 'Bilet negăsit' }, { status: 404 })

  const owner = await User.findOne({ clerkId: ticket.clerkId }).lean() as IUser | null
  const displayName = owner
    ? owner.firstName && owner.lastName
      ? `${owner.firstName} ${owner.lastName}`
      : owner.email
    : ticket.clerkId

  const entries = (await entriesForTickets([ticket])).get(String(ticket._id)) ?? ticketEntries(ticket, null)

  return NextResponse.json({
    workshops: workshopsLabel(entries),
    entries: { allowed: entries.allowed, used: entries.used, remaining: entries.remaining, extraWorkshops: entries.extraWorkshops },
    ticketId: (ticket._id as { toString(): string }).toString(),
    ticketNumber: ticket.ticketNumber,
    ticketTitle: ticket.ticketTitle,
    status: ticket.status,
    category: ticket.category,
    owner: {
      name: displayName,
      email: owner?.email ?? null,
    },
  })
}

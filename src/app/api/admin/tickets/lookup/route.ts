import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'
import type { IUser } from '@/models'

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

  return NextResponse.json({
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

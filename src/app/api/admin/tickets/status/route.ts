import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'
import { parseWith, issuedTicketStatusInput } from '@/lib/validation'

export async function PATCH(req: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const dbUser = await User.findOne({ clerkId: clerkUser.id })
    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const parsed = parseWith(issuedTicketStatusInput, await req.json())

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { ticketId, status } = parsed.data

    const ticket = await IssuedTicket.findByIdAndUpdate(
      ticketId,
      { $set: { status } },
      { new: true }
    )

    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, User } from '@/models'

export async function PATCH(req: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const dbUser = await User.findOne({ clerkId: clerkUser.id })
    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'moderator')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { ticketId, status } = await req.json()

    if (!ticketId || !['active', 'used', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid ticketId or status' }, { status: 400 })
    }

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

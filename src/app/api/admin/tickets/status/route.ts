import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { IssuedTicket } from '@/models'
import { parseWith, issuedTicketStatusInput } from '@/lib/validation'

export async function PATCH(req: NextRequest) {
  try {
    await requireRole('admin', 'moderator')

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
    const authResponse = toAuthResponse(error)
    if (authResponse) return authResponse

    console.error('Error updating ticket status:', error)
    return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 })
  }
}

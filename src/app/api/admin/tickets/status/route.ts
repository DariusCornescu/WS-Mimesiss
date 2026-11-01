import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { IssuedTicket } from '@/models'
import { parseWith, issuedTicketStatusInput } from '@/lib/validation'

export async function PATCH(req: NextRequest) {
  try {
    const staff = await requireRole('admin', 'moderator')

    const parsed = parseWith(issuedTicketStatusInput, await req.json())

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { ticketId, status } = parsed.data

    if (status !== 'used' && staff.role !== 'admin') return NextResponse.json({ error: 'Doar administratorul poate reactiva sau anula un bilet.' }, { status: 403 })
    const ticket = await IssuedTicket.findOneAndUpdate(
      { _id: ticketId, ...(status === 'used' ? { status: 'active' } : {}) },
      { $set: { status } },
      { new: true }
    )

    if (!ticket) return NextResponse.json({ error: 'Biletul nu este activ sau a fost deja folosit.' }, { status: 409 })

    return NextResponse.json({ success: true, ticket })
  } catch (error) {
    const authResponse = toAuthResponse(error)
    if (authResponse) return authResponse

    console.error('Error updating ticket status:', error)
    return NextResponse.json({ error: 'Failed to update ticket status' }, { status: 500 })
  }
}

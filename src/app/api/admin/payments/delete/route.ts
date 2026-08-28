import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { Payment, IssuedTicket } from '@/models'

export async function DELETE(req: NextRequest) {
  try {
    await requireRole('admin')

    const { paymentId } = await req.json()

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Find and delete the payment
    const payment = await Payment.findById(paymentId)

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Delete associated issued tickets first, then the payment
    await IssuedTicket.deleteMany({ paymentId: paymentId })
    await Payment.findByIdAndDelete(paymentId)

    return NextResponse.json({ 
      success: true, 
      message: 'Payment deleted successfully' 
    })

  } catch (error) {
    const authResponse = toAuthResponse(error)
    if (authResponse) {
      return authResponse
    }

    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}

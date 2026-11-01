import { NextRequest, NextResponse } from 'next/server'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { Payment, IssuedTicket } from '@/models'
import { objectId } from '@/lib/validation'

export async function DELETE(req: NextRequest) {
  try {
    await requireRole('admin')

    const { paymentId } = await req.json()

    if (!objectId.safeParse(paymentId).success) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 })
    }

    // Find and delete the payment
    const payment = await Payment.findById(paymentId)

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Keep provider-backed records so later webhook retries cannot resurrect
    // deleted tickets. Refunds require a separate, auditable Stripe workflow.
    if (payment.stripePaymentIntentId || payment.stripeSessionId?.startsWith('pi_') || payment.stripeSessionId?.startsWith('cs_')) {
      return NextResponse.json({ error: 'Plățile Stripe nu pot fi șterse. Folosește procedura de rambursare și anulare a biletelor.' }, { status: 409 })
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

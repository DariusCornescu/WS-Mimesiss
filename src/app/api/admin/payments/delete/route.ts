import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { Payment, User, IssuedTicket } from '@/models'

export async function DELETE(req: NextRequest) {
  try {
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Check if user is admin
    const user = await User.findOne({ clerkId: clerkUser.id })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

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
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}

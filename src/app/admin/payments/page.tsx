import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType } from '@/types/models'
import connectDB from '@/lib/mongodb'
import { Payment, User, IssuedTicket } from '@/models'
// Import the new client component
import PaymentsClient from '@/components/payments/PaymentsClient'

// You can move these interfaces to a shared types file or to PaymentsClient.tsx
interface PaymentStats {
  totalRevenue: number
  totalPayments: number
  ticketTypeCounts: Record<string, number>
}

interface PaymentWithUser {
  _id: string
  clerkId: string
  stripeSessionId: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  ticketId: string
  ticketType: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: Date
  updatedAt: Date
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

export default async function PaymentsPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  const user: UserType = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  await connectDB()

  // Fetch payment statistics
  const payments = await Payment.find({}).sort({ createdAt: -1 }).lean()

  const ticketTypeCounts = payments
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => {
      if (p.ticketType) {
        acc[p.ticketType] = (acc[p.ticketType] || 0) + 1
      } else {
        acc['unknown'] = (acc['unknown'] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

  const stats: PaymentStats = {
    totalRevenue: payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0),
    totalPayments: payments.length,
    ticketTypeCounts,
  }

  // Fetch all payments with user details
  const allPaymentsData = payments
  const allClerkIds = [...new Set(allPaymentsData.map(p => p.clerkId))]
  const users = await User.find({ clerkId: { $in: allClerkIds } }) as UserType[]
  const userMap = new Map(users.map(u => [u.clerkId, u]))

  const recentPayments: PaymentWithUser[] = allPaymentsData.map(payment => {
    const paymentUser = userMap.get(payment.clerkId)
    return {
      _id: payment._id?.toString() || '',
      clerkId: payment.clerkId || '',
      stripeSessionId: payment.stripeSessionId || '',
      stripePaymentIntentId: payment.stripePaymentIntentId,
      amount: payment.amount || 0,
      currency: payment.currency || 'RON',
      ticketId: payment.ticketId || '',
      ticketType: payment.ticketType || '',
      status: payment.status || 'pending',
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      user: paymentUser ? {
        firstName: (paymentUser as UserType).firstName || '',
        lastName: (paymentUser as UserType).lastName || '',
        email: (paymentUser as UserType).email || ''
      } : undefined
    }
  })

  // Count issued tickets per payment
  const issuedCounts = await IssuedTicket.aggregate([
    { $group: { _id: '$paymentId', count: { $sum: 1 } } },
  ])
  const ticketCounts: Record<string, number> = Object.fromEntries(
    issuedCounts.map((r: { _id: string; count: number }) => [r._id, r.count])
  )

  return <PaymentsClient stats={stats} payments={recentPayments} ticketCounts={ticketCounts} />
}
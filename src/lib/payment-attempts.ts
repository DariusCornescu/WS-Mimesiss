import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import { Payment, Ticket, User, type IUser } from '@/models'
import { PaymentAttempt, type PaymentAttemptRecord } from '@/models/PaymentAttempt'
import { stripe } from '@/lib/stripe'
import { getUncachedAppSettings } from '@/lib/settings'
import { registrationProfile } from '@/lib/registration-profile'
import { purchasePolicy } from '@/lib/payment-policy'
import { RequestError } from '@/lib/request-security'

export async function reservePayment(clerkId: string, ticketId: string, quantity: number): Promise<PaymentAttemptRecord> {
  await connectDB()
  const settings = await getUncachedAppSettings()
  return mongoose.connection.transaction(async session => {
    // This shared write serializes all purchases and fulfillment for one user.
    const user = await User.findOneAndUpdate({ clerkId }, { $inc: { paymentRevision: 1 } }, { new: true, session }).lean() as IUser | null
    if (!user || !registrationProfile(user)) throw new RequestError(409, 'Completează profilul înainte de plată.', 'profile_incomplete')
    const ticket = await Ticket.findById(ticketId).session(session).lean()
    if (!ticket) throw new RequestError(404, 'Bilet negăsit.')
    const payments = await Payment.find({ clerkId, status: 'completed', ...(ticket.category === 'ball' ? { ticketCategory: 'ball' } : { ticketType: ticket.type }) }).session(session).lean()
    const purchased = payments.reduce((sum, payment) => sum + (payment.quantity || 1), 0)
    const amount = purchasePolicy(ticket, quantity, settings, purchased)
    const pending = await PaymentAttempt.findOne({ clerkId, status: 'pending' }).session(session).lean() as PaymentAttemptRecord | null
    if (pending) {
      if (pending.ticketId === ticketId && pending.quantity === quantity && pending.amount === amount) return pending
      throw new RequestError(409, 'Ai o plată începută. Anuleaz-o înainte de a schimba biletele.', 'payment_pending')
    }
    const [attempt] = await PaymentAttempt.create([{
      clerkId, ticketId, ticketType: ticket.type, ticketTitle: ticket.title,
      category: ticket.category, quantity, amount, email: user.email, status: 'pending',
    }], { session })
    return attempt.toObject() as PaymentAttemptRecord
  })
}

export async function intentForAttempt(attempt: PaymentAttemptRecord) {
  if (attempt.stripePaymentIntentId) return stripe.paymentIntents.retrieve(attempt.stripePaymentIntentId)
  // Stripe may prune idempotency keys after 24h. An uncertain old request needs
  // reconciliation; never risk creating a second charge after that boundary.
  if (Date.now() - new Date(attempt.createdAt).getTime() > 23 * 60 * 60 * 1000) {
    throw new RequestError(409, 'Plata necesită verificare. Contactează organizatorii.', 'payment_review')
  }
  const intent = await stripe.paymentIntents.create({
    amount: attempt.amount, currency: 'ron', receipt_email: attempt.email,
    description: attempt.ticketTitle + ' ×' + attempt.quantity,
    metadata: {
      attemptId: String(attempt._id), clerkId: attempt.clerkId, ticketId: attempt.ticketId,
      ticketType: attempt.ticketType, ticketTitle: attempt.ticketTitle,
      ticketCategory: attempt.category, quantity: String(attempt.quantity),
    },
    automatic_payment_methods: { enabled: true },
  }, { idempotencyKey: 'purchase-' + String(attempt._id) })
  await PaymentAttempt.updateOne({ _id: attempt._id }, { $set: { stripePaymentIntentId: intent.id } })
  return intent
}

export async function cancelPendingPayment(clerkId: string) {
  await connectDB()
  const attempt = await PaymentAttempt.findOne({ clerkId, status: 'pending' }).lean() as PaymentAttemptRecord | null
  if (!attempt) return
  const intent = await intentForAttempt(attempt)
  if (intent.status === 'succeeded' || intent.status === 'processing') throw new RequestError(409, 'Plata este în curs de confirmare. Așteaptă actualizarea biletelor.')
  if (intent.status !== 'canceled') await stripe.paymentIntents.cancel(intent.id)
  // Only release the reservation once Stripe confirms the intent cannot be paid.
  await PaymentAttempt.updateOne({ _id: attempt._id, status: 'pending' }, { $set: { status: 'cancelled' } })
}

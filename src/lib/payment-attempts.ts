import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import { Payment, Ticket, User, type IUser } from '@/models'
import { PaymentAttempt, type PaymentAttemptRecord } from '@/models/PaymentAttempt'
import { stripe } from '@/lib/stripe'
import { getUncachedAppSettings } from '@/lib/settings'
import { registrationProfile } from '@/lib/registration-profile'
import { purchasePolicy } from '@/lib/payment-policy'
import { RequestError } from '@/lib/request-security'
import { ticketsTaken } from '@/lib/ticket-stock'

// An open checkout holds its tickets. Past this age the hold may be released
// for another buyer, after Stripe confirms the payment can no longer succeed.
const STALE_HOLD_MS = 30 * 60 * 1000

export async function reservePayment(clerkId: string, ticketId: string, quantity: number): Promise<PaymentAttemptRecord> {
  try {
    return await reserve(clerkId, ticketId, quantity)
  } catch (error) {
    // Sold out may only mean abandoned checkouts are sitting on the last units.
    if (!(error instanceof RequestError) || error.code !== 'sold_out') throw error
    if (!(await releaseStaleHolds(ticketId))) throw error
    return reserve(clerkId, ticketId, quantity)
  }
}

async function reserve(clerkId: string, ticketId: string, quantity: number): Promise<PaymentAttemptRecord> {
  await connectDB()
  const settings = await getUncachedAppSettings()
  let transactionAttempt = 0
  return mongoose.connection.transaction(async session => {
    // Buyers of a limited ticket contend for one document. Avoid retry storms.
    if (transactionAttempt++ > 0) {
      const ceiling = Math.min(1000, 50 * 2 ** Math.min(transactionAttempt, 5))
      await new Promise<void>(resolve => setTimeout(resolve, Math.random() * ceiling))
    }
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
    if (typeof ticket.maxQuantity === 'number') {
      // This shared write serializes every purchase of the ticket, so two
      // buyers cannot both count the last unit as free.
      await Ticket.updateOne({ _id: ticket._id }, { $inc: { stockRevision: 1 } }, { session })
      const taken = (await ticketsTaken([ticketId], session)).get(ticketId) ?? 0
      if (taken + quantity > ticket.maxQuantity) throw new RequestError(409, 'Biletele de acest tip s-au epuizat.', 'sold_out')
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

/** Cancels at Stripe first; false when the payment went through or still may. */
async function releaseAttempt(attempt: PaymentAttemptRecord) {
  const intent = await intentForAttempt(attempt)
  if (intent.status === 'succeeded' || intent.status === 'processing') return false
  if (intent.status !== 'canceled') await stripe.paymentIntents.cancel(intent.id)
  // Only release the reservation once Stripe confirms the intent cannot be paid.
  await PaymentAttempt.updateOne({ _id: attempt._id, status: 'pending' }, { $set: { status: 'cancelled' } })
  return true
}

export async function cancelPendingPayment(clerkId: string) {
  await connectDB()
  const attempt = await PaymentAttempt.findOne({ clerkId, status: 'pending' }).lean() as PaymentAttemptRecord | null
  if (!attempt) return
  if (!(await releaseAttempt(attempt))) throw new RequestError(409, 'Plata este în curs de confirmare. Așteaptă actualizarea biletelor.')
}

/** Frees units held by checkouts abandoned long ago. Returns how many attempts were released. */
async function releaseStaleHolds(ticketId: string) {
  const stale = await PaymentAttempt.find({
    ticketId, status: 'pending', createdAt: { $lt: new Date(Date.now() - STALE_HOLD_MS) },
  }).sort({ createdAt: 1 }).limit(20).lean<PaymentAttemptRecord[]>()
  let released = 0
  for (const attempt of stale) {
    // One attempt that Stripe refuses to cancel must not block the others.
    try { if (await releaseAttempt(attempt)) released++ } catch { console.error('Stale payment hold could not be released') }
  }
  return released
}

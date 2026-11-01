import mongoose from 'mongoose'
import type Stripe from 'stripe'
import connectDB from '@/lib/mongodb'
import { Payment, Counter, IssuedTicket, User } from '@/models'
import { PaymentAttempt, type PaymentAttemptRecord } from '@/models/PaymentAttempt'

class FulfillmentAlreadyComplete extends Error {}

export async function fulfillPayment(intent: Stripe.PaymentIntent) {
  if (intent.status !== 'succeeded' || intent.currency !== 'ron' || intent.amount_received !== intent.amount) throw new Error('Unexpected payment state')
  const meta = intent.metadata
  const quantity = Number(meta.quantity || '1')
  if (!meta.clerkId || !meta.ticketId || !meta.ticketType || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) throw new Error('Invalid payment metadata')
  if (meta.attemptId && !mongoose.isValidObjectId(meta.attemptId)) throw new Error('Invalid payment attempt')
  await connectDB()
  // Read-only replay fast path. The transaction below still rechecks concurrent
  // first deliveries; all purchase attributes must match this completed record.
  if (await Payment.exists({
    stripeSessionId: intent.id, clerkId: meta.clerkId, amount: intent.amount,
    quantity, ticketId: meta.ticketId, ticketType: meta.ticketType,
    ticketCategory: meta.ticketCategory === 'ball' ? 'ball' : 'workshop',
    $or: [{ fulfillmentComplete: true }, { status: 'refunded' }],
  })) return
  let transactionAttempt = 0
  try {
    await mongoose.connection.transaction(async session => {
      // Concurrent issuances share a sequence. Avoid immediate retry storms.
      if (transactionAttempt++ > 0) {
        const ceiling = Math.min(1000, 50 * 2 ** Math.min(transactionAttempt, 5))
        await new Promise<void>(resolve => setTimeout(resolve, Math.random() * ceiling))
      }
      // Claim the shared sequence first: contending transactions retry before
      // reading/writing user, payment and ticket documents. The block remains
      // inside the transaction, so failures and duplicate deliveries roll it back.
      const sequence = await Counter.findOneAndUpdate(
        { _id: 'issuedTicket' }, { $inc: { seq: quantity } },
        { new: true, upsert: true, session },
      )
      const firstNumber = sequence!.seq - quantity + 1
      const owner = await User.findOneAndUpdate({ clerkId: meta.clerkId }, { $inc: { paymentRevision: 1 } }, { session, new: true })
      if (!owner) throw new Error('Payment owner missing')
      const attempt = meta.attemptId
        ? await PaymentAttempt.findById(meta.attemptId).session(session).lean() as PaymentAttemptRecord | null
        : null
      if (meta.attemptId && (!attempt || attempt.clerkId !== meta.clerkId || attempt.ticketId !== meta.ticketId || attempt.ticketType !== meta.ticketType || attempt.quantity !== quantity || attempt.amount !== intent.amount || attempt.category !== meta.ticketCategory || (attempt.stripePaymentIntentId && attempt.stripePaymentIntentId !== intent.id) || attempt.status === 'cancelled')) {
        throw new Error('Payment does not match its reservation')
      }
      let payment = await Payment.findOne({ stripeSessionId: intent.id }).session(session)
      if (payment?.fulfillmentComplete || payment?.status === 'refunded') throw new FulfillmentAlreadyComplete()
      if (payment && (payment.clerkId !== meta.clerkId || payment.amount !== intent.amount)) throw new Error('Conflicting payment record')
      if (!payment) {
        const records = await Payment.create([{
          clerkId: meta.clerkId, stripeSessionId: intent.id, stripePaymentIntentId: intent.id,
          ticketId: meta.ticketId, ticketType: meta.ticketType,
          ticketCategory: meta.ticketCategory === 'ball' ? 'ball' : 'workshop', quantity,
          amount: intent.amount, currency: 'RON', status: 'completed',
          metadata: { ticketTitle: meta.ticketTitle || meta.ticketType },
        }], { session })
        payment = records[0]
      }
      const paymentId = String(payment._id)
      // Supports retrying historical partial fulfillment as well as new payments.
      const issued = await IssuedTicket.countDocuments({ paymentId }).session(session)
      if (issued > quantity) throw new Error('Existing ticket count requires reconciliation')
      // Historical partial fulfillment needs only the still-missing numbers.
      if (issued > 0) await Counter.updateOne({ _id: 'issuedTicket' }, { $inc: { seq: -issued } }, { session })
      for (let i = issued; i < quantity; i++) {
        await IssuedTicket.create([{
          ticketNumber: firstNumber + i - issued, clerkId: meta.clerkId, paymentId,
          ticketTypeId: meta.ticketId, ticketTitle: meta.ticketTitle || meta.ticketType,
          ticketType: meta.ticketType, category: meta.ticketCategory === 'ball' ? 'ball' : 'workshop',
          pricePerTicket: Math.floor(intent.amount / quantity) + (i < intent.amount % quantity ? 1 : 0), currency: 'RON',
        }], { session })
      }
      payment.status = 'completed'
      payment.fulfillmentComplete = true
      await payment.save({ session })
      if (attempt) await PaymentAttempt.updateOne({ _id: attempt._id }, { $set: { status: 'completed', stripePaymentIntentId: intent.id } }, { session })
    })
  } catch (error) {
    if (!(error instanceof FulfillmentAlreadyComplete)) throw error
  }
}

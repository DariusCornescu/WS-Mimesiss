import mongoose from 'mongoose'
import connectDB from '@/lib/mongodb'
import { Payment, Ticket, User, type IUser } from '@/models'
import { PaymentAttempt, type PaymentAttemptRecord } from '@/models/PaymentAttempt'
import { stripe } from '@/lib/stripe'
import { getUncachedAppSettings } from '@/lib/settings'
import { registrationProfile, purchaseProfile } from '@/lib/registration-profile'
import { purchasePolicy } from '@/lib/payment-policy'
import { RequestError } from '@/lib/request-security'
import { ticketsTaken } from '@/lib/ticket-stock'
import { holdsWorkshopTicket } from '@/lib/registration'

// An open checkout holds its tickets. Past this age the hold may be released
// for another buyer, after Stripe confirms the payment can no longer succeed.
const STALE_HOLD_MS = 30 * 60 * 1000
// Stripe refuses RON charges under 2.00 RON (amounts are in bani).
const MIN_CARD_AMOUNT_BANI = 200

/**
 * Holds a purchase for one buyer. `addOnTicketId` adds an add-on (extra
 * workshop places) to a workshop ticket in the same payment; both are checked
 * as if bought on their own, and the attempt amount is their total.
 */
export async function reservePayment(clerkId: string, ticketId: string, quantity: number, addOnTicketId?: string): Promise<PaymentAttemptRecord> {
  try {
    return await reserveReleasingStale(clerkId, ticketId, quantity, addOnTicketId)
  } catch (error) {
    // A buyer who changes their mind before paying (another ticket, adding or
    // dropping the add-on) gets a new checkout in place of the open one. The
    // open one is cancelled at Stripe first, and never once it is paid or
    // still processing: then cancelPendingPayment refuses and says so.
    if (!(error instanceof RequestError) || error.code !== 'payment_pending') throw error
    await cancelPendingPayment(clerkId)
    return reserveReleasingStale(clerkId, ticketId, quantity, addOnTicketId)
  }
}

async function reserveReleasingStale(clerkId: string, ticketId: string, quantity: number, addOnTicketId?: string): Promise<PaymentAttemptRecord> {
  try {
    return await reserve(clerkId, ticketId, quantity, addOnTicketId)
  } catch (error) {
    // Sold out may only mean abandoned checkouts are sitting on the last units.
    if (!(error instanceof RequestError) || error.code !== 'sold_out') throw error
    let released = await releaseStaleHolds(ticketId)
    if (addOnTicketId) released += await releaseStaleHolds(addOnTicketId)
    if (!released) throw error
    return reserve(clerkId, ticketId, quantity, addOnTicketId)
  }
}

async function reserve(clerkId: string, ticketId: string, quantity: number, addOnTicketId?: string): Promise<PaymentAttemptRecord> {
  if (addOnTicketId === ticketId) throw new RequestError(400, 'Suplimentul trebuie să fie diferit de bilet.')
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
    if (!purchaseProfile(user)) throw new RequestError(409, 'Completează telefonul și instituția în profil înainte de plată.', 'profile_incomplete')
    const ticket = await Ticket.findById(ticketId).session(session).lean()
    if (!ticket) throw new RequestError(404, 'Bilet negăsit.')
    if ((ticket.extraWorkshops ?? 0) > 0 && !(await holdsWorkshopTicket(clerkId, session))) {
      throw new RequestError(409, 'Workshopul suplimentar se poate cumpăra doar după biletul cu acces la workshopuri.', 'base_ticket_required')
    }
    const payments = await Payment.find({ clerkId, status: 'completed', ...(ticket.category === 'ball' ? { ticketCategory: 'ball' } : { ticketType: ticket.type }) }).session(session).lean()
    const purchased = payments.reduce((sum, payment) => sum + (payment.quantity || 1), 0)
    const baseAmount = purchasePolicy(ticket, quantity, settings, purchased)
    let addOn: { ticket: NonNullable<typeof ticket>; amount: number } | null = null
    if (addOnTicketId) {
      const extra = await Ticket.findById(addOnTicketId).session(session).lean()
      if (!extra || !((extra.extraWorkshops ?? 0) > 0)) throw new RequestError(404, 'Suplimentul nu a fost găsit.')
      if (!ticket.workshopAccess) throw new RequestError(409, 'Suplimentul se poate adăuga doar la un bilet cu acces la workshopuri.', 'base_ticket_required')
      const extraPaid = await Payment.find({ clerkId, status: 'completed', ticketType: extra.type }).session(session).lean()
      addOn = { ticket: extra, amount: purchasePolicy(extra, 1, settings, extraPaid.reduce((sum, payment) => sum + (payment.quantity || 1), 0)) }
    }
    const amount = baseAmount + (addOn?.amount ?? 0)
    if (amount < MIN_CARD_AMOUNT_BANI) {
      throw new RequestError(400, 'Prețul este sub minimul de 2 RON acceptat la plata cu cardul. Contactează organizatorii.', 'amount_too_small')
    }
    const pending = await PaymentAttempt.findOne({ clerkId, status: 'pending' }).session(session).lean() as PaymentAttemptRecord | null
    if (pending) {
      if (pending.ticketId === ticketId && pending.quantity === quantity && pending.amount === amount && (pending.addOnTicketId ?? '') === (addOnTicketId ?? '')) return pending
      throw new RequestError(409, 'Ai o plată începută. Anuleaz-o înainte de a schimba biletele.', 'payment_pending')
    }
    // These shared writes serialize every purchase of a limited ticket, so two
    // buyers cannot both count the last unit as free.
    const limits = [{ item: ticket, units: quantity, message: 'Biletele de acest tip s-au epuizat.' }]
    if (addOn) limits.push({ item: addOn.ticket, units: 1, message: 'Locurile pentru workshopul suplimentar s-au epuizat.' })
    for (const { item, units, message } of limits) {
      if (typeof item.maxQuantity !== 'number') continue
      await Ticket.updateOne({ _id: item._id }, { $inc: { stockRevision: 1 } }, { session })
      const id = String(item._id)
      const taken = (await ticketsTaken([id], session)).get(id) ?? 0
      if (taken + units > item.maxQuantity) throw new RequestError(409, message, 'sold_out')
    }
    const [attempt] = await PaymentAttempt.create([{
      clerkId, ticketId, ticketType: ticket.type, ticketTitle: ticket.title,
      category: ticket.category, quantity, amount, email: user.email, status: 'pending',
      ...(addOn ? {
        addOnTicketId, addOnTicketType: addOn.ticket.type, addOnTicketTitle: addOn.ticket.title, addOnAmount: addOn.amount,
      } : {}),
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
    description: attempt.ticketTitle + ' ×' + attempt.quantity + (attempt.addOnTicketTitle ? ' + ' + attempt.addOnTicketTitle : ''),
    metadata: {
      attemptId: String(attempt._id), clerkId: attempt.clerkId, ticketId: attempt.ticketId,
      ticketType: attempt.ticketType, ticketTitle: attempt.ticketTitle,
      ticketCategory: attempt.category, quantity: String(attempt.quantity),
      ...(attempt.addOnTicketId ? {
        addOnTicketId: attempt.addOnTicketId, addOnTicketType: attempt.addOnTicketType ?? '',
        addOnTicketTitle: attempt.addOnTicketTitle ?? '', addOnAmount: String(attempt.addOnAmount ?? 0),
      } : {}),
    },
    automatic_payment_methods: { enabled: true },
  }, { idempotencyKey: 'purchase-' + String(attempt._id) })
  const stored = await PaymentAttempt.updateOne({ _id: attempt._id, status: 'pending' }, { $set: { stripePaymentIntentId: intent.id } })
  if (stored.matchedCount === 0) {
    // The checkout was cancelled while Stripe was creating this intent. Its
    // client secret must never reach a browser, so close it at Stripe too.
    try { await stripe.paymentIntents.cancel(intent.id) } catch { console.error('Orphaned payment intent could not be cancelled', { intentId: intent.id }) }
    throw new RequestError(409, 'Plata a fost anulată. Reîncarcă pagina și încearcă din nou.', 'payment_cancelled')
  }
  return intent
}

/** Cancels at Stripe first; false when the payment went through or still may. */
async function releaseAttempt(attempt: PaymentAttemptRecord) {
  if (!attempt.stripePaymentIntentId) {
    // A client secret is only returned after its intent id is stored, so an
    // attempt without one was never payable. Release it here: asking Stripe to
    // create the intent first fails forever when Stripe rejected it (for
    // example an amount under its minimum), which would lock the buyer out.
    const released = await PaymentAttempt.updateOne(
      { _id: attempt._id, status: 'pending', stripePaymentIntentId: null },
      { $set: { status: 'cancelled' } },
    )
    if (released.modifiedCount === 1) return true
    const current = await PaymentAttempt.findById(attempt._id).lean() as PaymentAttemptRecord | null
    if (!current || current.status !== 'pending') return true
    attempt = current
  }
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
    $or: [{ ticketId }, { addOnTicketId: ticketId }], status: 'pending', createdAt: { $lt: new Date(Date.now() - STALE_HOLD_MS) },
  }).sort({ createdAt: 1 }).limit(20).lean<PaymentAttemptRecord[]>()
  let released = 0
  for (const attempt of stale) {
    // One attempt that Stripe refuses to cancel must not block the others.
    try { if (await releaseAttempt(attempt)) released++ } catch { console.error('Stale payment hold could not be released') }
  }
  return released
}

import mongoose, { Types } from 'mongoose'
import connectDB from '@/lib/mongodb'
import { Workshop, Registration, User, Ticket, Payment, IssuedTicket } from '@/models'

export type RegisterResult =
  | { ok: true }
  | {
      ok: false
      code: 'not_found' | 'not_open' | 'full' | 'duplicate' | 'user_limit' | 'ticket_required' | 'unknown'
      message: string
    }

/** Workshops a ticket with workshop access covers before any add-on. */
export const MAX_WORKSHOPS_PER_USER = 2

class RegistrationRejected extends Error {
  constructor(readonly result: RegisterResult) { super('Registration rejected') }
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000
}

interface WorkshopGate {
  wsType: 'workshop' | 'conferinta'
  status: 'active' | 'cancelled' | 'completed'
  editionId?: Types.ObjectId
  maxParticipants: number
}

type Session = mongoose.ClientSession | null

export interface WorkshopEntitlement {
  /** Holds a paid ticket with workshop access that still stands. */
  holdsTicket: boolean
  /** Extra workshop places from add-ons; 0 unless `holdsTicket`. */
  extraPlaces: number
}

/**
 * What each participant's purchases entitle them to. A purchase stands while
 * its payment is completed and not all of its issued tickets are cancelled;
 * manual payments have no issued tickets and count as they are. Add-ons
 * extend a workshop ticket, so their places count only next to one.
 * Registration, the sale of add-ons and ticket validation all read this.
 */
export async function workshopEntitlements(userIds: string[], session: Session = null): Promise<Map<string, WorkshopEntitlement>> {
  const result = new Map<string, WorkshopEntitlement>(userIds.map(id => [id, { holdsTicket: false, extraPlaces: 0 }]))
  if (userIds.length === 0) return result
  const products = await Ticket.find({ $or: [{ workshopAccess: true }, { extraWorkshops: { $gt: 0 } }] })
    .session(session).select('_id workshopAccess extraWorkshops').lean()
  if (products.length === 0) return result
  const productById = new Map(products.map(product => [String(product._id), product]))
  const payments = await Payment.find({ clerkId: { $in: userIds }, status: 'completed', ticketId: { $in: [...productById.keys()] } })
    .session(session).select('_id clerkId ticketId quantity').lean()
  if (payments.length === 0) return result
  const issued = await IssuedTicket.find({ paymentId: { $in: payments.map(payment => String(payment._id)) } })
    .session(session).select('paymentId status').lean()
  const withTickets = new Set<string>()
  const withLiveTicket = new Set<string>()
  for (const ticket of issued) {
    withTickets.add(ticket.paymentId)
    if (ticket.status !== 'cancelled') withLiveTicket.add(ticket.paymentId)
  }
  const addOnPlaces = new Map<string, number>()
  for (const payment of payments) {
    const paymentId = String(payment._id)
    if (withTickets.has(paymentId) && !withLiveTicket.has(paymentId)) continue
    const product = productById.get(String(payment.ticketId))
    const entitlement = result.get(payment.clerkId)
    if (!product || !entitlement) continue
    if (product.workshopAccess) entitlement.holdsTicket = true
    const places = product.extraWorkshops ?? 0
    if (places > 0) addOnPlaces.set(payment.clerkId, (addOnPlaces.get(payment.clerkId) ?? 0) + places * (payment.quantity || 1))
  }
  for (const [userId, places] of addOnPlaces) {
    const entitlement = result.get(userId)
    if (entitlement?.holdsTicket) entitlement.extraPlaces = places
  }
  return result
}

/**
 * A participant may pick workshops once they hold a paid ticket of a type the
 * organisers marked as giving workshop access. Add-ons are sold against the
 * same rule.
 */
export async function holdsWorkshopTicket(userId: string, session: Session = null) {
  return (await workshopEntitlements([userId], session)).get(userId)?.holdsTicket ?? false
}

/** Extra workshop places bought as add-ons, counted only next to a workshop ticket. */
async function extraWorkshopPlaces(userId: string, session: Session) {
  return (await workshopEntitlements([userId], session)).get(userId)?.extraPlaces ?? 0
}

/** Serialize each user's registrations and commit seat/count changes together. */
export async function registerUserForWorkshop(opts: {
  userId: string
  workshopId: string
  /**
   * Public-flow edition scoping: the workshop must belong to this edition.
   * null = registrations closed (no active edition); undefined = no edition
   * filter.
   */
  activeEditionId?: string | null
  /** Registration deadline applied to wsType 'workshop' (public flow only). */
  registrationDeadline?: Date | null
  registrationStartTime?: Date | null
  /**
   * Admin manual assignment: skips the status/edition/deadline gates but
   * keeps the capacity, per-user and duplicate guards.
   */
  adminOverride?: boolean
  /**
   * Public flow: a wsType 'workshop' needs a paid ticket with workshop
   * access. Conferences and admin assignment are not affected.
   */
  requireTicket?: boolean
}): Promise<RegisterResult> {
  const { userId, workshopId, activeEditionId, registrationDeadline, registrationStartTime, adminOverride, requireTicket } = opts

  await connectDB()

  if (!Types.ObjectId.isValid(workshopId)) {
    return { ok: false, code: 'not_found', message: 'Workshop-ul nu a fost găsit' }
  }

  try {
    let transactionAttempt = 0
    return await mongoose.connection.transaction(async session => {
      // Desynchronise retries competing for the same workshop document.
      // Wait before the first DB operation, not while holding a transaction lock.
      if (transactionAttempt++ > 0) {
        const ceiling = Math.min(1000, 50 * 2 ** Math.min(transactionAttempt, 5))
        await new Promise<void>(resolve => setTimeout(resolve, Math.random() * ceiling))
      }
      const owner = await User.findOneAndUpdate({ clerkId: userId }, { $inc: { registrationRevision: 1 } }, { session })
      if (!owner) return { ok: false, code: 'not_found', message: 'Profilul participantului nu a fost găsit.' } as RegisterResult
      const workshop = await Workshop.findById(workshopId).session(session)
        .select('wsType status editionId maxParticipants')
        .lean() as WorkshopGate | null

      if (!workshop) {
        return { ok: false, code: 'not_found', message: 'Workshop-ul nu a fost găsit' }
      }

      if (!adminOverride) {
        if (registrationStartTime && registrationStartTime > new Date()) return { ok: false, code: 'not_open', message: 'Înscrierile nu au început.' } as RegisterResult
        if (activeEditionId === null) {
          return { ok: false, code: 'not_open', message: 'Înscrierile nu sunt deschise momentan' }
        }
        if (workshop.status !== 'active') {
          return { ok: false, code: 'not_open', message: 'Înscrierile pentru acest workshop sunt închise' }
        }
        if (activeEditionId !== undefined && String(workshop.editionId ?? '') !== activeEditionId) {
          return { ok: false, code: 'not_open', message: 'Înscrierile nu sunt deschise momentan' }
        }
        if (workshop.wsType === 'workshop' && registrationDeadline && registrationDeadline < new Date()) {
          return { ok: false, code: 'not_open', message: 'Termenul limită pentru înregistrări la workshop-uri a expirat' }
        }
        if (requireTicket && workshop.wsType === 'workshop' && !(await holdsWorkshopTicket(userId, session))) {
          return { ok: false, code: 'ticket_required', message: 'Pentru a te înscrie la workshopuri ai nevoie de un bilet cu acces la workshopuri. Îl poți cumpăra din pagina „Cumpără bilet”.' }
        }
      }

      // Claim the contested seat before the per-user query work. Any later
      // business rejection must throw so this reservation rolls back.
      if (workshop.wsType === 'workshop') {
        const reserveFilter: Record<string, unknown> = {
          _id: workshopId,
          $expr: { $lt: ['$currentParticipants', '$maxParticipants'] },
        }
        if (!adminOverride) {
          reserveFilter.status = 'active'
          if (typeof activeEditionId === 'string') reserveFilter.editionId = new Types.ObjectId(activeEditionId)
        }
        const reserved = await Workshop.findOneAndUpdate(reserveFilter, { $inc: { currentParticipants: 1 } }, { session })
        if (!reserved) {
          if (await Registration.exists({ userId, workshopId }).session(session)) {
            return { ok: false, code: 'duplicate', message: 'Ești deja înregistrat la acest workshop' }
          }
          return { ok: false, code: 'full', message: 'Nu mai sunt locuri disponibile la acest workshop' }
        }
      } else {
        await Workshop.updateOne({ _id: workshopId }, { $inc: { currentParticipants: 1 } }, { session })
      }

      // The unique index is a second backstop; a business rejection aborts
      // the transaction including its early seat reservation.
      const existing = await Registration.exists({ userId, workshopId }).session(session)
      if (existing) {
        throw new RegistrationRejected({ ok: false, code: 'duplicate', message: 'Ești deja înregistrat la acest workshop' })
      }

      if (workshop.wsType === 'workshop') {
        const others = await Registration.find({ userId, workshopId: { $ne: workshopId } })
          .session(session).select('workshopId')
          .lean()
        const otherIds = others
          .map(reg => reg.workshopId)
          .filter(id => Types.ObjectId.isValid(id))
          .map(id => new Types.ObjectId(id))
        const userWorkshopCount = otherIds.length === 0
          ? 0
          : await Workshop.countDocuments({ _id: { $in: otherIds }, wsType: 'workshop' }).session(session)

        if (userWorkshopCount >= MAX_WORKSHOPS_PER_USER) {
          const limit = MAX_WORKSHOPS_PER_USER + await extraWorkshopPlaces(userId, session)
          if (userWorkshopCount >= limit) {
            const addOnForSale = limit === MAX_WORKSHOPS_PER_USER
              && await Ticket.exists({ extraWorkshops: { $gt: 0 }, enabled: true }).session(session)
            throw new RegistrationRejected({
              ok: false,
              code: 'user_limit',
              message: `Poți fi înregistrat la maxim ${limit} workshop-uri simultan`
                + (addOnForSale ? '. Poți adăuga un workshop suplimentar din pagina „Cumpără bilet”.' : ''),
            })
          }
        }

      }

      await Registration.create([{ userId, workshopId }], { session })
      return { ok: true } as RegisterResult
    })
  } catch (error) {
    if (error instanceof RegistrationRejected) return error.result
    if (isDuplicateKeyError(error)) return { ok: false, code: 'duplicate', message: 'Ești deja înregistrat la acest workshop' }
    console.error('Registration transaction failed')
    return { ok: false, code: 'unknown', message: 'A apărut o eroare. Te rugăm încearcă din nou.' }
  }
}

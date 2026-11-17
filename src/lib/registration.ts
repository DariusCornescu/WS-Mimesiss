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

const MAX_WORKSHOPS_PER_USER = 2

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

/**
 * A participant may pick workshops once they hold a paid ticket of a type the
 * organisers marked as giving workshop access. A refunded payment does not
 * count, and neither does one whose issued tickets were all cancelled.
 * Manual payments have no issued tickets and count as they are.
 */
async function holdsWorkshopTicket(userId: string, session: mongoose.ClientSession) {
  const granting = await Ticket.find({ workshopAccess: true }).session(session).select('_id').lean()
  if (granting.length === 0) return false
  const payments = await Payment.find({
    clerkId: userId, status: 'completed', ticketId: { $in: granting.map(ticket => String(ticket._id)) },
  }).session(session).select('_id').lean()
  for (const payment of payments) {
    const paymentId = String(payment._id)
    const issued = await IssuedTicket.countDocuments({ paymentId }).session(session)
    if (issued === 0) return true
    if (await IssuedTicket.exists({ paymentId, status: { $ne: 'cancelled' } }).session(session)) return true
  }
  return false
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
          throw new RegistrationRejected({ ok: false, code: 'user_limit', message: 'Poți fi înregistrat la maxim 2 workshop-uri simultan' })
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

import { Types } from 'mongoose'
import connectDB from '@/lib/mongodb'
import { Workshop, Registration } from '@/models'

export type RegisterResult =
  | { ok: true }
  | {
      ok: false
      code: 'not_found' | 'not_open' | 'full' | 'duplicate' | 'user_limit' | 'unknown'
      message: string
    }

const MAX_WORKSHOPS_PER_USER = 2

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
 * Guarded registration core shared by the public action
 * (congres/workshops/actions.ts) and the admin manual-assignment flow
 * (admin/workshops/actions.ts).
 *
 * The capacity gate is the atomic findOneAndUpdate below: its filter only
 * matches while currentParticipants < maxParticipants, so two concurrent
 * requests cannot oversell the last seat. That makes currentParticipants the
 * authoritative counter — run the admin recount once when this first deploys,
 * so the counter starts from the true registration counts.
 *
 * scripts/test-concurrent-registration.mjs mirrors this shape as a probe;
 * keep the two in sync.
 */
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
  /**
   * Admin manual assignment: skips the status/edition/deadline gates but
   * keeps the capacity, per-user and duplicate guards.
   */
  adminOverride?: boolean
}): Promise<RegisterResult> {
  const { userId, workshopId, activeEditionId, registrationDeadline, adminOverride } = opts

  await connectDB()

  if (!Types.ObjectId.isValid(workshopId)) {
    return { ok: false, code: 'not_found', message: 'Workshop-ul nu a fost găsit' }
  }

  const workshop = await Workshop.findById(workshopId)
    .select('wsType status editionId maxParticipants')
    .lean() as WorkshopGate | null

  if (!workshop) {
    return { ok: false, code: 'not_found', message: 'Workshop-ul nu a fost găsit' }
  }

  if (!adminOverride) {
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
  }

  // Fast path for the common duplicate case; the unique {userId, workshopId}
  // index inside the create below stays as the race-safe backstop.
  const existing = await Registration.exists({ userId, workshopId })
  if (existing) {
    return { ok: false, code: 'duplicate', message: 'Ești deja înregistrat la acest workshop' }
  }

  if (workshop.wsType === 'workshop') {
    // Per-user cap. Small read-then-write race accepted: two parallel
    // registrations to different workshops can briefly leave a user with one
    // workshop too many — harmless next to overselling seats.
    const others = await Registration.find({ userId, workshopId: { $ne: workshopId } })
      .select('workshopId')
      .lean()
    const otherIds = others
      .map(reg => reg.workshopId)
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id))
    const userWorkshopCount = otherIds.length === 0
      ? 0
      : await Workshop.countDocuments({ _id: { $in: otherIds }, wsType: 'workshop' })

    if (userWorkshopCount >= MAX_WORKSHOPS_PER_USER) {
      return { ok: false, code: 'user_limit', message: 'Poți fi înregistrat la maxim 2 workshop-uri simultan' }
    }

    // Atomic seat reservation — the authoritative capacity gate. The public
    // flow re-asserts status/edition here so a mid-flight change cannot slip
    // past the earlier read.
    const reserveFilter: Record<string, unknown> = {
      _id: workshopId,
      $expr: { $lt: ['$currentParticipants', '$maxParticipants'] },
    }
    if (!adminOverride) {
      reserveFilter.status = 'active'
      if (typeof activeEditionId === 'string') {
        reserveFilter.editionId = new Types.ObjectId(activeEditionId)
      }
    }

    const reserved = await Workshop.findOneAndUpdate(reserveFilter, {
      $inc: { currentParticipants: 1 },
    })

    if (!reserved) {
      return { ok: false, code: 'full', message: 'Nu mai sunt locuri disponibile la acest workshop' }
    }
  } else {
    // Conferences have no capacity limit; just keep the counter in step.
    await Workshop.updateOne({ _id: workshopId }, { $inc: { currentParticipants: 1 } })
  }

  try {
    await Registration.create({ userId, workshopId })
  } catch (error) {
    // Give the reserved seat back before reporting anything.
    await Workshop.updateOne({ _id: workshopId }, { $inc: { currentParticipants: -1 } })

    if (isDuplicateKeyError(error)) {
      return { ok: false, code: 'duplicate', message: 'Ești deja înregistrat la acest workshop' }
    }

    console.error('Registration create failed:', error)
    return { ok: false, code: 'unknown', message: 'A apărut o eroare. Te rugăm încearcă din nou.' }
  }

  return { ok: true }
}

import connectDB from '@/lib/mongodb'
import { Registration, Workshop } from '@/models'
import { MAX_WORKSHOPS_PER_USER, sameTimeSlot, workshopEntitlements } from '@/lib/registration'
import { pathAudience, pathWorkshops } from '@/lib/path-project'
import { workshopChoiceOpen } from '@/lib/workshop-choice'
import type { AppSettingsPlain } from '@/lib/settings'

export interface PathChoiceItem {
  slug: string
  /** Null until the workshop has been published for choosing. */
  workshopId: string | null
  title: string
  doctors: string[]
  image: string | null
  /** ISO date of the day, e.g. "2026-12-04". */
  day: string | null
  time: string | null
  location: string | null
  seats: number | null
  seatsLeft: number | null
  chosen: boolean
  /** Not chosen, but shares a time slot with one that is. */
  clashes: boolean
}

export interface PathChoiceState {
  items: PathChoiceItem[]
  chosenCount: number
  /** Workshops the participant's purchases cover; 0 without a ticket. */
  limit: number
  holdsTicket: boolean
}

type GateSettings = Pick<AppSettingsPlain, 'globalRegistrationEnabled' | 'registrationStartTime' | 'registrationDeadline'>

/**
 * Whether PATH ticket holders can pick workshops right now: the organisers'
 * registration settings, plus the announced opening date. The date is skipped
 * only by the local dev server, so the page can be tried before it opens.
 */
export function pathChoiceOpen(settings: GateSettings, now = Date.now(), enforceOpeningDate = process.env.NODE_ENV !== 'development'): boolean {
  if (!workshopChoiceOpen(settings, now)) return false
  return !enforceOpeningDate || now >= Date.parse(pathAudience.workshopChoiceOpensAt)
}

interface PathWorkshopDoc {
  _id: unknown
  pathSlug: string
  date?: Date | null
  time?: string | null
  location?: string | null
  maxParticipants: number
  currentParticipants: number
}

/** The PATH programme merged with seats, schedule and the participant's choices. */
export async function getPathChoiceState(userId: string): Promise<PathChoiceState> {
  await connectDB()
  const docs = await Workshop.find({ pathSlug: { $in: pathWorkshops.map(workshop => workshop.slug) }, status: 'active', wsType: 'workshop' })
    .select('pathSlug date time location maxParticipants currentParticipants')
    .lean() as unknown as PathWorkshopDoc[]
  const docBySlug = new Map(docs.map(doc => [doc.pathSlug, doc]))
  const [registrations, entitlements] = await Promise.all([
    docs.length === 0 ? [] : Registration.find({ userId, workshopId: { $in: docs.map(doc => String(doc._id)) } }).select('workshopId').lean(),
    workshopEntitlements([userId]),
  ])
  const chosenIds = new Set(registrations.map(registration => registration.workshopId))
  const chosenDocs = docs.filter(doc => chosenIds.has(String(doc._id)))
  const entitlement = entitlements.get(userId)
  const holdsTicket = entitlement?.holdsTicket ?? false

  const items = pathWorkshops.map((workshop): PathChoiceItem => {
    const doc = docBySlug.get(workshop.slug)
    const chosen = doc ? chosenIds.has(String(doc._id)) : false
    return {
      slug: workshop.slug,
      workshopId: doc ? String(doc._id) : null,
      title: workshop.title,
      doctors: [workshop.doctor, ...(workshop.secondDoctor ? [workshop.secondDoctor.name] : [])],
      image: workshop.image ?? null,
      day: doc?.date ? new Date(doc.date).toISOString().slice(0, 10) : null,
      time: doc?.time || null,
      location: doc?.location || workshop.location || null,
      seats: doc ? doc.maxParticipants : null,
      seatsLeft: doc ? Math.max(0, doc.maxParticipants - doc.currentParticipants) : null,
      chosen,
      clashes: !!doc && !chosen && chosenDocs.some(other => sameTimeSlot(other, doc)),
    }
  })

  return {
    items,
    chosenCount: chosenDocs.length,
    limit: holdsTicket ? MAX_WORKSHOPS_PER_USER + (entitlement?.extraPlaces ?? 0) : 0,
    holdsTicket,
  }
}

/**
 * Create the Workshop document of every PATH entry that lacks one, and keep
 * titles and doctors in step with the programme. Seats, date, time and room
 * are set once here and afterwards belong to the admin form.
 */
export async function syncPathWorkshops(defaultSeats: number): Promise<{ created: number; total: number }> {
  await connectDB()
  const result = await Workshop.bulkWrite(pathWorkshops.map(workshop => ({
    updateOne: {
      filter: { pathSlug: workshop.slug },
      update: {
        $set: {
          title: workshop.title,
          instructor: [workshop.doctor, ...(workshop.secondDoctor ? [workshop.secondDoctor.name] : [])].join(', '),
        },
        $setOnInsert: {
          description: workshop.description,
          location: workshop.location ?? '',
          maxParticipants: workshop.seats ?? defaultSeats,
          currentParticipants: 0,
          wsType: 'workshop' as const,
          status: 'active' as const,
        },
      },
      upsert: true,
    },
  })))
  return { created: result.upsertedCount, total: pathWorkshops.length }
}

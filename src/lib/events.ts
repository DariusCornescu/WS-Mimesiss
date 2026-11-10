import { unstable_cache } from 'next/cache'
import connectDB from '@/lib/mongodb'
import { Edition, Project } from '@/models'

export type UpcomingEvent = {
  id: string
  title: string
  projectTitle: string
  summary: string
  href: string
  coverImage?: string
  coverPositionX: number
  coverPositionY: number
  /** ISO, ca să treacă granița server → client fără surprize. */
  startDate?: string
  endDate?: string
  status: 'upcoming' | 'active'
  /** Rând scurt sub dată pe cardul evidențiat, ex. când se deschid înscrierile. */
  note?: string
  /** Paleta cardului evidențiat; fără valoare se folosește cea a asociației. */
  theme?: 'path'
}

type EditionDoc = {
  _id: unknown
  projectId: unknown
  title: string
  startDate?: Date
  endDate?: Date
  status: 'upcoming' | 'active'
}

type ProjectDoc = {
  _id: unknown
  slug: string
  title: string
  summary: string
  coverImage?: string
  coverPositionX?: number
  coverPositionY?: number
  kind: 'congress' | 'standard' | 'announcement'
}

/**
 * Evenimentele viitoare de pe homepage sunt edițiile proiectelor publicate
 * care sunt `upcoming` sau `active` și nu s-au încheiat încă. O ediție fără
 * date rămâne listată (anunțată, dar încă neprogramată) și apare la final.
 */
async function readUpcomingEvents(limit: number): Promise<UpcomingEvent[]> {
  await connectDB()

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const editions = await Edition.find({
    status: { $in: ['upcoming', 'active'] },
    $or: [
      { endDate: { $gte: today } },
      { endDate: null, startDate: { $gte: today } },
      { endDate: null, startDate: null },
    ],
  })
    .select('projectId title startDate endDate status')
    .lean<EditionDoc[]>()

  if (editions.length === 0) return []

  const projects = await Project.find({ _id: { $in: editions.map(e => e.projectId) }, status: 'published' })
    .select('slug title summary coverImage coverPositionX coverPositionY kind')
    .lean<ProjectDoc[]>()
  const byId = new Map(projects.map(p => [String(p._id), p]))

  return editions
    .flatMap(edition => {
      const project = byId.get(String(edition.projectId))
      if (!project) return []
      return [{
        id: String(edition._id),
        title: edition.title,
        projectTitle: project.title,
        summary: project.summary,
        href: project.kind === 'congress' ? '/proiecte/mimesiss' : `/proiecte/${project.slug}`,
        coverImage: project.coverImage,
        coverPositionX: project.coverPositionX ?? 50,
        coverPositionY: project.coverPositionY ?? 50,
        startDate: edition.startDate?.toISOString(),
        endDate: edition.endDate?.toISOString(),
        status: edition.status,
      }]
    })
    .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))
    .slice(0, limit)
}

const cachedUpcomingEvents = unstable_cache(readUpcomingEvents, ['upcoming-events'], {
  tags: ['upcoming-events', 'active-edition'],
  revalidate: 300,
})

export function getUpcomingEvents(limit = 3): Promise<UpcomingEvent[]> {
  return cachedUpcomingEvents(limit)
}

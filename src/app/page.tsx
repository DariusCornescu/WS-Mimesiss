import AssociationHome from '@/components/asociatie/AssociationHome'
import { getPublishedProjects } from '@/lib/projects'
import { getPartners } from '@/lib/partners'
import { getUpcomingEvents, type UpcomingEvent } from '@/lib/events'
import { withPathEvent, withPathProject } from '@/lib/path-project'
import type { Partner } from '@/lib/partner-types'

export const metadata = {
  title: 'ASMM — Asociația Studenților în Medicină Militară',
  description: 'Asociația care organizează congresul MIMESISS și proiectele studenților la medicină militară.',
}

export default async function HomePage() {
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = []
  let partners: Partner[] = []
  let events: UpcomingEvent[] = []
  if (process.env.NODE_ENV !== 'development' || process.env.ASMM_LOCAL_PREVIEW !== '1') {
    try {
      const results = await Promise.all([getPublishedProjects(), getPartners(true), getUpcomingEvents()])
      projects = results[0]
      partners = results[1]
      events = results[2]
    } catch (error) {
      if (process.env.NODE_ENV !== 'development') throw error
      console.warn('Homepage preview: MongoDB unavailable; showing local fallback content.')
    }
  }
  // Grila de proiecte apare doar când există proiecte publicate din admin; PATH
  // nu o pornește singur, fiindcă ar arăta ca singurul proiect al asociației.
  return <AssociationHome projects={projects.length > 0 ? withPathProject(projects) : projects} partners={partners} events={withPathEvent(events)} />
}

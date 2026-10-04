import AssociationHome from '@/components/asociatie/AssociationHome'
import { getPublishedProjects } from '@/lib/projects'
import { getPartners } from '@/lib/partners'
import type { Partner } from '@/lib/partner-types'

export const metadata = {
  title: 'ASMM — Asociația Studenților în Medicină Militară',
  description: 'Asociația care organizează congresul MIMESISS și proiectele studenților la medicină militară.',
}

export default async function HomePage() {
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = []
  let partners: Partner[] = []
  if (process.env.NODE_ENV !== 'development' || process.env.ASMM_LOCAL_PREVIEW !== '1') {
    try {
      const results = await Promise.all([getPublishedProjects(), getPartners(true)])
      projects = results[0]
      partners = results[1]
    } catch (error) {
      if (process.env.NODE_ENV !== 'development') throw error
      console.warn('Homepage preview: MongoDB unavailable; showing local fallback content.')
    }
  }
  return <AssociationHome projects={projects} partners={partners} />
}

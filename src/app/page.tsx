import AssociationHome from '@/components/asociatie/AssociationHome'
import { getPublishedProjects } from '@/lib/projects'

export const metadata = {
  title: 'ASMM — Asociația Studenților în Medicină Militară',
  description: 'Asociația care organizează congresul MIMESISS și proiectele studenților la medicină militară.',
}

export default async function HomePage() {
  let projects: Awaited<ReturnType<typeof getPublishedProjects>> = []
  if (process.env.NODE_ENV !== 'development' || process.env.ASMM_LOCAL_PREVIEW !== '1') {
    try {
      projects = await getPublishedProjects()
    } catch (error) {
      if (process.env.NODE_ENV !== 'development') throw error
      console.warn('Homepage preview: MongoDB unavailable; showing local fallback content.')
    }
  }
  return <AssociationHome projects={projects} />
}

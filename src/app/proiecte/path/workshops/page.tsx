import type { Metadata } from 'next'
import PathWorkshopsPage from '@/components/path/PathWorkshops'
import { PATH_COVER, PATH_WORKSHOPS_HREF, currentEpochSeconds, pathProject } from '@/lib/path-project'

const title = `Workshopuri și medici — ${pathProject.title}`
const description = `Workshopurile PATH (${pathProject.dateLabel}) și medicii care le susțin.`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH_WORKSHOPS_HREF },
  openGraph: {
    title,
    description,
    url: PATH_WORKSHOPS_HREF,
    images: [{ url: PATH_COVER, width: 1600, height: 1000, alt: title }],
  },
}

// Ca pagina PATH: secțiunea de înscriere își schimbă faza după oră.
export default function Page() {
  return <PathWorkshopsPage renderedAt={currentEpochSeconds()} />
}

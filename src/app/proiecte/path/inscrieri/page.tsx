import type { Metadata } from 'next'
import PathRegistrationPage from '@/components/path/PathRegistrationPage'
import { PATH_COVER, PATH_REGISTRATION_HREF, currentEpochSeconds, pathProject } from '@/lib/path-project'

const title = `Înscrieri — ${pathProject.title}`
const description = `Înscrierea la PATH (${pathProject.dateLabel}): biletul, workshopurile incluse și pașii următori.`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: PATH_REGISTRATION_HREF },
  openGraph: {
    title,
    description,
    url: PATH_REGISTRATION_HREF,
    images: [{ url: PATH_COVER, width: 1600, height: 1000, alt: title }],
  },
}

// Ca pagina PATH: secțiunea de înscriere își schimbă faza după oră.
export default function Page() {
  return <PathRegistrationPage renderedAt={currentEpochSeconds()} />
}

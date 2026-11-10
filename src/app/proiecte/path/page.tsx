import type { Metadata } from 'next'
import PathProject from '@/components/path/PathProject'
import { PATH_COVER, PATH_HREF, currentEpochSeconds, pathProject } from '@/lib/path-project'

const title = `${pathProject.title} — ${pathProject.tagline}`

export const metadata: Metadata = {
  title: pathProject.title,
  description: `${pathProject.summary} ${pathProject.dateLabel}, prima ediție.`,
  alternates: { canonical: PATH_HREF },
  openGraph: {
    title,
    description: pathProject.summary,
    url: PATH_HREF,
    images: [{ url: PATH_COVER, width: 1600, height: 1000, alt: title }],
  },
}

// Faza afișată (înscrieri, start, încheiat) depinde de oră. Pagina se
// regenerează odată cu setările din layout (la 5 minute), iar între timp
// clientul trece singur la faza corectă.
export default function Page() {
  return <PathProject renderedAt={currentEpochSeconds()} />
}

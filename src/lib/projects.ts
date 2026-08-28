import connectDB from '@/lib/mongodb'
import { Project } from '@/models'

/**
 * Forma documentului după `.lean()`. Mongoose tipează lean() ca o uniune care
 * include și array, așa că fără parametrul explicit orice acces la câmp pică
 * la typecheck.
 */
export type ProjectDoc = {
  slug: string
  title: string
  kicker?: string
  summary: string
  description?: string
  coverImage?: string
  order: number
  status: 'draft' | 'published'
  kind: 'congress' | 'standard'
}

export type ProjectCard = {
  slug: string
  title: string
  kicker?: string
  summary: string
  description?: string
  coverImage?: string
  kind: 'congress' | 'standard'
  /** Clase de grid, calculate ca grila să nu rămână cu goluri. */
  span: string
  /** Congresul are secțiunea lui; restul au pagină de proiect. */
  href: string
}

const FEATURED_SPAN = 'sm:col-span-2 lg:col-span-2 lg:row-span-2'

/**
 * Grila are 3 coloane, iar congresul ocupă 2×2 — adică umple coloanele 1-2 pe
 * primele două rânduri. Restul proiectelor intră pe coloana 3 a acelor rânduri
 * și abia apoi pe rânduri întregi de câte 3.
 *
 * Dacă ultimul rând rămâne incomplet, ultimul card se lățește ca să-l umple.
 * Fără asta, un număr „nepotrivit" de proiecte lasă coloane goale în pagină —
 * iar numărul se schimbă de fiecare dată când asociația editează lista.
 */
function spanForLast(standardCount: number): string {
  if (standardCount <= 2) return ''
  const leftover = (standardCount - 2) % 3
  if (leftover === 1) return 'sm:col-span-2 lg:col-span-3'
  if (leftover === 2) return 'sm:col-span-2 lg:col-span-2'
  return ''
}

/** Ține `sizes` sincron cu lățimea reală a cardului. */
export function cardSizes(span: string) {
  if (span.includes('lg:col-span-3')) return '100vw'
  if (span.includes('lg:col-span-2')) return '(max-width: 1024px) 100vw, 66vw'
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
}

export async function getPublishedProjects(): Promise<ProjectCard[]> {
  await connectDB()

  const docs = await Project.find({ status: 'published' })
    .sort({ order: 1, createdAt: 1 })
    .lean<ProjectDoc[]>()

  // Congresul primul, indiferent de `order`: e ancora grilei.
  const congress = docs.filter((d) => d.kind === 'congress')
  const standard = docs.filter((d) => d.kind !== 'congress')
  const lastSpan = spanForLast(standard.length)

  return [...congress, ...standard].map((doc, i, all) => {
    const isCongress = doc.kind === 'congress'
    return {
      slug: doc.slug,
      title: doc.title,
      kicker: doc.kicker,
      summary: doc.summary,
      description: doc.description,
      coverImage: doc.coverImage,
      kind: doc.kind,
      href: isCongress ? '/congres' : `/proiecte/${doc.slug}`,
      span: isCongress ? FEATURED_SPAN : i === all.length - 1 ? lastSpan : '',
    }
  })
}

export async function getProjectBySlug(slug: string): Promise<ProjectDoc | null> {
  await connectDB()
  return Project.findOne({ slug, status: 'published' }).lean<ProjectDoc>()
}

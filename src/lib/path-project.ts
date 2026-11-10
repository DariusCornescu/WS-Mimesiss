import type { ProjectCard } from '@/lib/projects'
import type { UpcomingEvent } from '@/lib/events'

/**
 * PATH — Practical Abilities & Training in Healthcare.
 *
 * Tot conținutul proiectului stă aici, ca pagina, homepage-ul și meniul să
 * spună același lucru. Când asociația trimite workshopurile și medicii, se
 * completează doar `pathWorkshops`; restul paginii se adaptează singur.
 */

export const PATH_SLUG = 'path'
export const PATH_HREF = '/proiecte/path'
export const PATH_COVER = '/projects/path/cover.webp'

export const pathProject = {
  title: 'PATH',
  tagline: 'Practical Abilities & Training in Healthcare',
  kicker: 'Proiect nou · Prima ediție',
  summary:
    'Două zile de workshopuri medicale interactive și provocări clinice, pentru studenții care vor să exerseze medicina aplicată.',
  /** Decembrie = ora României, UTC+2. Finalul este exclusiv (miezul nopții de după a doua zi). */
  startsAt: '2026-12-04T00:00:00+02:00',
  endsAt: '2026-12-06T00:00:00+02:00',
  dateLabel: '4–5 decembrie 2026',
  registrationOpensAt: '2026-11-18T00:00:00+02:00',
  registrationOpensLabel: '18 noiembrie',
  /** Se completează când fluxul de înscriere este gata; până atunci pagina anunță doar data. */
  registrationHref: null as string | null,
} as const

export const pathStory = {
  lead: 'Un nou început prinde contur.',
  paragraphs: [
    'În perioada 4–5 decembrie are loc prima ediție PATH — un proiect dedicat studenților care vor să experimenteze medicina aplicată și să-și exerseze abilitățile practice în mod direct și interactiv.',
    'Născut din pasiunea pentru medicină și dorința de a încuraja învățarea prin experiență, PATH își propune să creeze un cadru în care teoria prinde viață, iar curiozitatea devine oportunitate de dezvoltare.',
    'Credem că formarea unui medic nu înseamnă doar acumularea de informații, ci și capacitatea de a le transforma în competențe, de a gândi critic și de a acționa cu încredere.',
  ],
  statement: 'Două zile. Experiențe noi. O perspectivă diferită asupra medicinei.',
  invitation: 'PATH începe aici. Vă invităm să fiți parte dintr-un proiect în care învățarea capătă o nouă dimensiune.',
}

export const pathHighlights = [
  {
    title: 'Workshopuri medicale interactive',
    text: 'Îți exersezi abilitățile practice în mod direct, alături de medici.',
  },
  {
    title: 'Provocări clinice',
    text: 'Situații menite să stimuleze gândirea critică și să consolideze cunoștințele.',
  },
  {
    title: 'O perspectivă reală',
    text: 'Vezi de aproape provocările profesiei medicale, dincolo de teorie.',
  },
]

export type PathWorkshop = {
  title: string
  /** Medicul care susține workshopul, cu titlul afișat întocmai. */
  doctor: string
  /** Specialitatea sau funcția, ex. „Medic primar chirurgie generală”. */
  doctorRole?: string
  description: string
  /** Cale locală din /public, ex. „/projects/path/workshops/sutura.webp”. */
  image?: string
  imageAlt?: string
  /** Text liber, ex. „Vineri, 4 decembrie · 10:00–12:00”. */
  schedule?: string
  location?: string
  seats?: number
}

/** Gol până când asociația trimite lista; pagina afișează atunci un anunț. */
export const pathWorkshops: PathWorkshop[] = []

/** Ora serverului, în secunde; ținută aici ca randarea componentelor să rămână pură. */
export function currentEpochSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function pathCard(): ProjectCard {
  return {
    slug: PATH_SLUG,
    title: pathProject.title,
    kicker: pathProject.kicker,
    summary: pathProject.summary,
    coverImage: PATH_COVER,
    coverPositionX: 50,
    coverPositionY: 50,
    kind: 'standard',
    span: '',
    href: PATH_HREF,
  }
}

/**
 * Adaugă PATH în lista de proiecte, imediat după congres. Dacă asociația
 * creează ulterior din admin un proiect cu același slug, acela are prioritate.
 */
export function withPathProject(projects: ProjectCard[]): ProjectCard[] {
  if (projects.some(project => project.slug === PATH_SLUG)) return projects
  const congressCount = projects.filter(project => project.kind === 'congress').length
  return [...projects.slice(0, congressCount), pathCard(), ...projects.slice(congressCount)]
}

/** Adaugă ediția PATH la evenimentele viitoare, până la încheierea ei. */
export function withPathEvent(events: UpcomingEvent[], now: number = Date.now(), limit = 3): UpcomingEvent[] {
  if (now >= Date.parse(pathProject.endsAt)) return events
  if (events.some(event => event.href === PATH_HREF)) return events
  const started = now >= Date.parse(pathProject.startsAt)
  const pathEvent: UpcomingEvent = {
    id: 'path-2026',
    title: 'PATH 2026',
    projectTitle: pathProject.tagline,
    summary: pathProject.summary,
    href: PATH_HREF,
    coverImage: PATH_COVER,
    coverPositionX: 50,
    coverPositionY: 50,
    startDate: new Date(pathProject.startsAt).toISOString(),
    // Ultima zi, nu miezul nopții de după: altfel intervalul afișat ar include 6 decembrie.
    endDate: new Date(Date.parse(pathProject.endsAt) - 1).toISOString(),
    status: started ? 'active' : 'upcoming',
    note: started ? undefined : `Înscrieri pe site din ${pathProject.registrationOpensLabel}`,
    theme: 'path',
  }
  return [...events, pathEvent]
    .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))
    .slice(0, limit)
}

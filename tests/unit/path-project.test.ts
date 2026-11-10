import { describe, expect, it } from 'vitest'
import type { UpcomingEvent } from '@/lib/events'
import type { ProjectCard } from '@/lib/projects'
import { PATH_HREF, PATH_SLUG, pathProject, withPathEvent, withPathProject } from '@/lib/path-project'

const card = (slug: string, kind: ProjectCard['kind'] = 'standard'): ProjectCard => ({
  slug, title: slug, summary: 'Rezumat', kind, span: '', href: `/proiecte/${slug}`,
})

const event = (id: string, startDate?: string): UpcomingEvent => ({
  id, title: id, projectTitle: 'Proiect', summary: 'Rezumat', href: `/proiecte/${id}`,
  coverPositionX: 50, coverPositionY: 50, startDate, status: 'upcoming',
})

const at = (iso: string) => Date.parse(iso)

describe('withPathProject', () => {
  it('places PATH right after the congress', () => {
    const slugs = withPathProject([card('mimesiss', 'congress'), card('bal'), card('cort')]).map(project => project.slug)
    expect(slugs).toEqual(['mimesiss', PATH_SLUG, 'bal', 'cort'])
  })

  it('leaves the list alone when a project with the same slug is already published', () => {
    const projects = [card('mimesiss', 'congress'), card(PATH_SLUG)]
    expect(withPathProject(projects)).toBe(projects)
  })

  it('links the card to the dedicated page', () => {
    expect(withPathProject([])[0]).toMatchObject({ slug: PATH_SLUG, href: PATH_HREF, title: 'PATH' })
  })
})

describe('withPathEvent', () => {
  it('lists the edition as upcoming before it starts, with the registration note', () => {
    const [path] = withPathEvent([], at('2026-11-10T12:00:00+02:00'))
    expect(path).toMatchObject({ href: PATH_HREF, status: 'upcoming', theme: 'path' })
    expect(path.note).toContain(pathProject.registrationOpensLabel)
  })

  it('formats as 4–5 December in Romanian time, not spilling into the 6th', () => {
    const [path] = withPathEvent([], at('2026-11-10T12:00:00+02:00'))
    const format = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Bucharest' })
    expect(format.formatRange(new Date(path.startDate!), new Date(path.endDate!))).toBe('4–5 decembrie 2026')
  })

  it('marks the edition active while it runs and drops the registration note', () => {
    const [path] = withPathEvent([], at('2026-12-04T10:00:00+02:00'))
    expect(path.status).toBe('active')
    expect(path.note).toBeUndefined()
  })

  it('removes the edition once it has ended', () => {
    const events = [event('altul', '2027-01-10T00:00:00.000Z')]
    expect(withPathEvent(events, at('2026-12-06T00:00:00+02:00'))).toBe(events)
  })

  it('orders by start date, keeps undated editions last and respects the limit', () => {
    const events = [event('devreme', '2026-11-20T00:00:00.000Z'), event('tarziu', '2027-03-01T00:00:00.000Z'), event('fara-data')]
    const ids = withPathEvent(events, at('2026-11-10T12:00:00+02:00')).map(item => item.id)
    expect(ids).toEqual(['devreme', 'path-2026', 'tarziu'])
  })

  it('does not duplicate an edition that already points to the PATH page', () => {
    const events = [{ ...event('path-din-admin', '2026-12-04T00:00:00.000Z'), href: PATH_HREF }]
    expect(withPathEvent(events, at('2026-11-10T12:00:00+02:00'))).toBe(events)
  })
})

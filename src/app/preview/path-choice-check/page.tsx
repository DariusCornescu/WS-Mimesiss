import { notFound } from 'next/navigation'
import AccountLayout from '@/components/dashboard/AccountLayout'
import PageIntro from '@/components/ui/PageIntro'
import PathWorkshopPicker from '@/components/path/PathWorkshopPicker'
import { pathProject, pathWorkshops } from '@/lib/path-project'
import type { PathChoiceItem } from '@/lib/path-choice'

export const metadata = { title: 'Previzualizare alegere workshopuri', robots: { index: false, follow: false } }

/** Sample schedule and seats: one chosen, one clashing, one full, one not published. */
const samples: Partial<PathChoiceItem>[] = [
  { day: '2026-12-04', time: '10:00', location: 'Sala 1', seats: 20, seatsLeft: 9, chosen: true },
  { day: '2026-12-04', time: '10:00', location: 'Sala 2', seats: 25, seatsLeft: 14, clashes: true },
  { day: '2026-12-04', time: '13:00', location: 'Laborator', seats: 15, seatsLeft: 0 },
  { day: '2026-12-04', time: '13:00', location: 'Sala 3', seats: 15, seatsLeft: 1 },
  { day: '2026-12-05', time: '10:00', location: 'Sala 1', seats: 20, seatsLeft: 20 },
  { workshopId: null },
]

export default function PathChoiceCheck() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const items = pathWorkshops.slice(0, samples.length).map((workshop, index): PathChoiceItem => ({
    slug: workshop.slug,
    workshopId: `0123456789abcdef0123456${index}`,
    title: workshop.title,
    doctors: [workshop.doctor, ...(workshop.secondDoctor ? [workshop.secondDoctor.name] : [])],
    image: workshop.image ?? null,
    day: null, time: null, location: null, seats: null, seatsLeft: null, chosen: false, clashes: false,
    ...samples[index],
  }))
  return <AccountLayout user={{ email: 'participant@example.invalid', firstName: 'Participant', lastName: 'PATH', role: 'user' }}>
    <div className="space-y-6">
      <PageIntro eyebrow={`PATH · ${pathProject.dateLabel}`} title="Alege workshopurile" description="Date de probă, doar pentru verificarea vizuală a ecranului de alegere." />
      <PathWorkshopPicker items={items} chosenCount={1} limit={2} canChoose canCancel />
    </div>
  </AccountLayout>
}

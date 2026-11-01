import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FaCalendarAlt, FaPlus, FaUserPlus } from 'react-icons/fa'
import Link from 'next/link'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType, Workshop as WorkshopType } from '@/types/models'
import connectDB from '@/lib/mongodb'
import { Workshop } from '@/models'
import WorkshopAdminRow from '@/components/admin/WorkshopAdminRow'
import { DownloadReportButton } from '@/components/admin/DownloadReportButton'
import RecountParticipantsButton from '@/components/admin/RecountParticipantsButton'
import PageIntro from '@/components/ui/PageIntro'
import { getRegistrations } from '@/app/admin/workshops/actions'

export default async function AdminWorkshopsPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user: UserType = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  await connectDB()

  // Fetch all workshops
  const workshops = await Workshop.find({}).sort({ date: 1 }).lean() as unknown as WorkshopType[]

  // Fetch registrations for all workshops and serialize
  const workshopsWithRegistrations = await Promise.all(
    workshops.map(async (workshop) => {
      const registrations = await getRegistrations(workshop._id?.toString() || workshop.id || '')
      return {
        workshop: JSON.parse(JSON.stringify(workshop)),
        registrations: JSON.parse(JSON.stringify(registrations)),
      }
    })
  )

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare · Workshop-uri"
        title="Gestionare workshop-uri"
        description="Creează activități, urmărește înscrierile și gestionează prezența participanților."
        actions={
          <>
            <Link
              href="/admin/workshops/assign"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-secondary/40 bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <FaUserPlus aria-hidden="true" className="mr-2 h-4 w-4" />
              Alocare manuală
            </Link>
            <Link
              href="/admin/workshops/new"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent/50 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <FaPlus aria-hidden="true" className="mr-2 h-4 w-4" />
              Workshop nou
            </Link>
            <DownloadReportButton />
          </>
        }
      />

      <section aria-labelledby="workshops-list-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Activități configurate</p>
            <h2 id="workshops-list-title" className="mt-1 text-xl font-semibold text-foreground">
              Workshop-uri și conferințe
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {workshopsWithRegistrations.length}{' '}
            {workshopsWithRegistrations.length === 1 ? 'activitate' : 'activități'}
          </p>
        </div>

        {workshopsWithRegistrations.length > 0 ? (
          <ul className="space-y-4">
            {workshopsWithRegistrations.map(({ workshop, registrations }) => (
              <WorkshopAdminRow
                key={workshop._id?.toString() || workshop.id || ''}
                workshop={workshop}
                registrations={registrations}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/70 px-6 py-12 text-center">
            <FaCalendarAlt aria-hidden="true" className="mx-auto h-12 w-12 text-accent/70" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Niciun workshop configurat</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Creează prima activitate pentru a începe gestionarea programului și a înscrierilor.
            </p>
            <Link
              href="/admin/workshops/new"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <FaPlus aria-hidden="true" className="mr-2 h-4 w-4" />
              Workshop nou
            </Link>
          </div>
        )}
      </section>

      <div className="flex justify-start sm:justify-end">
        <RecountParticipantsButton />
      </div>
    </div>
  )
}

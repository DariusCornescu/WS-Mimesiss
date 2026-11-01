import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType, Workshop as WorkshopType } from '@/types/models'
import { ManualAssignmentForm } from '@/components/admin/ManualAssignmentForm'
import { getAllUsers } from '../actions'
import { getAllWorkshops } from '@/app/congres/workshops/actions'
import Link from 'next/link'
import { FaArrowLeft, FaUserPlus } from 'react-icons/fa'
import PageIntro from '@/components/ui/PageIntro'

export default async function ManualAssignmentPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user: UserType = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Fetch all users and workshops
  const [usersData, workshopsData] = await Promise.all([
    getAllUsers(),
    getAllWorkshops()
  ])

  // Convert to plain objects to avoid serialization issues
  const users = JSON.parse(JSON.stringify(usersData)) as UserType[]

  const workshops = JSON.parse(JSON.stringify(workshopsData)) as WorkshopType[]
  const hasUsers = users.length > 0
  const hasWorkshops = workshops.length > 0

  const emptyMessage = !hasUsers && !hasWorkshops
    ? 'Nu există încă utilizatori sau workshopuri disponibile pentru alocare.'
    : !hasUsers
      ? 'Nu există încă utilizatori disponibili pentru alocare.'
      : 'Nu există încă workshopuri disponibile pentru alocare.'

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare ASMM"
        title="Alocarea manuală a participanților"
        description="Alocă manual utilizatori la workshopuri. Limita de două workshopuri per utilizator și capacitatea fiecărui workshop sunt verificate automat."
        actions={
          <Link
            href="/admin/workshops"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FaArrowLeft aria-hidden="true" className="h-4 w-4" />
            Înapoi la workshopuri
          </Link>
        }
      />

      {hasUsers && hasWorkshops ? (
        <section
          aria-labelledby="manual-assignment-heading"
          className="overflow-hidden rounded-xl border border-border/60 bg-card/85 shadow-lg shadow-background/15 backdrop-blur-sm"
        >
          <div className="border-b border-border/60 px-4 py-5 sm:px-6">
            <h2 id="manual-assignment-heading" className="text-lg font-semibold text-foreground">
              Detaliile alocării
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Alege utilizatorul și workshopul în care dorești să îl înscrii.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <ManualAssignmentForm users={users} workshops={workshops} />
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="manual-assignment-empty-title"
          className="rounded-xl border border-border/60 bg-card/85 p-8 text-center shadow-lg shadow-background/15 sm:p-12"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-accent/25 bg-primary/20 text-xl text-accent">
            <FaUserPlus aria-hidden="true" />
          </div>
          <h2 id="manual-assignment-empty-title" className="mt-5 text-xl font-semibold text-foreground">
            Alocarea nu este disponibilă încă
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            {emptyMessage}
          </p>
        </section>
      )}
    </div>
  )
}

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FaArrowRight, FaCheckCircle, FaCircle, FaTimes } from 'react-icons/fa'
import { getMyRegistrations } from '@/app/congres/workshops/actions'
import { getAppSettings } from '@/lib/settings'
import PageIntro from '@/components/ui/PageIntro'

export default async function RegistrationsPage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/auth/login')

  const [registrations, appSettings] = await Promise.all([
    getMyRegistrations(),
    getAppSettings(),
  ])
  const workshopVisibleToPublic = appSettings.workshopVisibleToPublic || false

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Participarea mea"
        title="Înscrierile mele"
        description="Urmărește workshopurile și conferințele la care te-ai înscris, împreună cu starea prezenței."
      />

      {registrations.length > 0 ? (
        <ul className="grid gap-4">
          {registrations.map((registration) => (
            <li key={registration._id} className="rounded-xl border border-border/60 bg-card/85 p-5 shadow-lg shadow-background/15 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-foreground">{registration.workshop.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {registration.workshop.date && (
                      <span>{new Date(registration.workshop.date).toLocaleDateString('ro-RO')}</span>
                    )}
                    {registration.workshop.date && registration.workshop.location && (
                      <FaCircle className="h-1.5 w-1.5" aria-hidden="true" />
                    )}
                    {registration.workshop.location && <span>{registration.workshop.location}</span>}
                    {(registration.workshop.date || registration.workshop.location) && (
                      <FaCircle className="h-1.5 w-1.5" aria-hidden="true" />
                    )}
                    <span>
                      {registration.workshop.wsType === 'conferinta'
                        ? `${registration.workshop.currentParticipants} participanți`
                        : `${registration.workshop.currentParticipants} / ${registration.workshop.maxParticipants} locuri ocupate`}
                    </span>
                  </div>

                  {registration.attendance.confirmed ? (
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1.5 text-sm font-medium text-secondary">
                      <FaCheckCircle aria-hidden="true" />
                      Prezență confirmată
                    </span>
                  ) : (
                    <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
                      <FaTimes aria-hidden="true" />
                      Prezență neconfirmată
                    </span>
                  )}
                </div>

                {workshopVisibleToPublic && (
                  <Link
                    href={`/congres/workshops/${registration.workshop._id || registration.workshop.id || ''}`}
                    className="inline-flex min-h-11 flex-shrink-0 items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Detalii {registration.workshop.wsType === 'workshop' ? 'workshop' : 'conferință'}
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="rounded-xl border border-border/60 bg-card/85 p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold text-foreground">Nu ai încă nicio înscriere</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Descoperă programul și alege workshopurile potrivite pentru tine.
          </p>
          <Link
            href="/congres/workshops"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-accent/50 bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Vezi workshopurile disponibile
            <FaArrowRight aria-hidden="true" />
          </Link>
        </section>
      )}
    </div>
  )
}

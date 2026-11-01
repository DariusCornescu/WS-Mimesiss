import { FaCalendarCheck, FaExclamationTriangle, FaUser } from 'react-icons/fa'
import { getUser } from '@/app/dashboard/profile/actions'
import connectDB from '@/lib/mongodb'
import { Registration, Workshop } from '@/models'
import AttendanceToggle from '@/components/AttendanceToggle'
import PageIntro from '@/components/ui/PageIntro'
import { requireRoleOrRedirect } from '@/lib/auth'

export default async function AttendancePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  await requireRoleOrRedirect('admin', 'moderator')

  // Fetch user data from database
  const user = await getUser(userId)

  if (!user) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Administrare ASMM"
          title="Confirmarea prezenței"
          description="Verifică și actualizează prezența participanților la workshopuri."
        />

        <section
          role="alert"
          aria-labelledby="attendance-user-error-title"
          className="rounded-xl border border-destructive/35 bg-destructive/10 p-8 text-center shadow-lg shadow-background/15 sm:p-12"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-destructive/30 bg-destructive/10 text-xl text-destructive">
            <FaExclamationTriangle aria-hidden="true" />
          </div>
          <h2 id="attendance-user-error-title" className="mt-5 text-xl font-semibold text-foreground">
            Utilizatorul nu a fost găsit
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Verifică utilizatorul selectat și încearcă din nou.
          </p>
        </section>
      </div>
    )
  }

  // Fetch registrations and workshops separately - much simpler
  await connectDB()
  const registrations = await Registration.find({ userId: user.clerkId }).lean()

  // Get all workshop IDs from registrations
  const workshopIds = registrations.map((reg) => reg.workshopId)

  // Fetch all workshops at once
  const workshops = await Workshop.find({ _id: { $in: workshopIds } }).lean()

  // Create a workshop lookup map
  const workshopMap = Object.fromEntries(
    workshops.map((workshop) => [String(workshop._id), workshop])
  )

  // Combine registrations with workshops
  const registrationsWithWorkshops = registrations
    .filter((registration) => workshopMap[registration.workshopId])
    .map((registration) => ({
      ...registration,
      _id: String(registration._id),
      workshop: workshopMap[registration.workshopId],
      attendance: registration.attendance || { confirmed: false },
    }))

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const registrationCount = registrationsWithWorkshops.length

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare ASMM"
        title="Confirmarea prezenței"
        description={
          <>
            Verifică și actualizează prezența pentru{' '}
            <strong className="font-semibold text-foreground">{fullName || user.email}</strong>.
          </>
        }
      />

      <section
        aria-labelledby="attendance-user-heading"
        className="rounded-xl border border-border/60 bg-card/85 p-5 shadow-lg shadow-background/15 backdrop-blur-sm sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 flex-none place-items-center rounded-full border border-accent/25 bg-primary/20 text-accent">
            <FaUser aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Participant</p>
            <h2 id="attendance-user-heading" className="mt-1 text-xl font-semibold text-foreground">
              Informații despre utilizator
            </h2>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-background/50 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Nume</dt>
            <dd className="mt-2 font-medium text-foreground">{fullName || 'Nespecificat'}</dd>
          </div>
          <div className="min-w-0 rounded-lg border border-border/60 bg-background/50 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Email</dt>
            <dd className="mt-2 break-words font-medium text-foreground">{user.email}</dd>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/50 p-4 sm:col-span-2 lg:col-span-1">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Tip utilizator</dt>
            <dd className="mt-2">
              <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-foreground">
                {user.userType || 'Nespecificat'}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="attendance-registrations-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Participare</p>
            <h2 id="attendance-registrations-heading" className="mt-1 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <FaCalendarCheck aria-hidden="true" className="text-accent" />
              Înregistrări la workshopuri
            </h2>
          </div>
          <span className="w-fit rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {registrationCount === 1 ? '1 înregistrare' : `${registrationCount} înregistrări`}
          </span>
        </div>

        {registrationCount === 0 ? (
          <div
            aria-labelledby="attendance-empty-title"
            className="rounded-xl border border-border/60 bg-card/85 p-8 text-center shadow-lg shadow-background/15 sm:p-12"
          >
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-accent/25 bg-primary/20 text-xl text-accent">
              <FaCalendarCheck aria-hidden="true" />
            </div>
            <h3 id="attendance-empty-title" className="mt-5 text-xl font-semibold text-foreground">
              Nicio înregistrare găsită
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              Acest utilizator nu este înscris momentan la niciun workshop.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {registrationsWithWorkshops.map((registration) => (
              <li key={registration._id}>
                <article className="overflow-hidden rounded-xl border border-border/60 border-l-4 border-l-primary bg-card/85 shadow-lg shadow-background/15 backdrop-blur-sm">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-foreground">
                          {registration.workshop.title}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex w-fit flex-none rounded-full border px-3 py-1 text-sm font-medium ${
                          registration.attendance.confirmed
                            ? 'border-accent/30 bg-primary/15 text-accent'
                            : 'border-border bg-muted text-muted-foreground'
                        }`}
                      >
                        {registration.attendance.confirmed ? 'Prezent' : 'Neconfirmat'}
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">Tip</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {registration.workshop.wsType === 'conferinta' ? 'Conferință' : 'Workshop'}
                        </dd>
                      </div>
                      {registration.workshop.date && (
                        <div>
                          <dt className="text-muted-foreground">Data</dt>
                          <dd className="mt-1 font-medium text-foreground">
                            {new Date(registration.workshop.date).toLocaleDateString('ro-RO')}
                          </dd>
                        </div>
                      )}
                      {registration.workshop.time && (
                        <div>
                          <dt className="text-muted-foreground">Ora</dt>
                          <dd className="mt-1 font-medium text-foreground">{registration.workshop.time}</dd>
                        </div>
                      )}
                      {registration.workshop.location && (
                        <div>
                          <dt className="text-muted-foreground">Locația</dt>
                          <dd className="mt-1 font-medium text-foreground">{registration.workshop.location}</dd>
                        </div>
                      )}
                      {registration.workshop.instructor && (
                        <div>
                          <dt className="text-muted-foreground">Instructor</dt>
                          <dd className="mt-1 font-medium text-foreground">{registration.workshop.instructor}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-6 border-t border-border/60 pt-5">
                      <AttendanceToggle
                        registrationId={registration._id}
                        userId={userId}
                        initialStatus={registration.attendance.confirmed}
                        confirmedAt={registration.attendance.confirmedAt?.toString()}
                      />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

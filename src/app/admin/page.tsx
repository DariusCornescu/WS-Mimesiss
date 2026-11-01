import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FaUsers, FaCalendarAlt, FaUserPlus, FaCog, FaCreditCard, FaFolderOpen, FaTicketAlt, FaImages } from 'react-icons/fa'
import Link from 'next/link'
import { syncUserWithDatabase } from '@/lib/auth'
import { User as UserType } from '@/types/models'
import connectDB from '@/lib/mongodb'
import { User, Workshop, Registration } from '@/models'
import PageIntro from '@/components/ui/PageIntro'

export default async function AdminDashboard() {
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

  // Get statistics from MongoDB
  const [totalUsers, totalWorkshops, totalRegistrations] = await Promise.all([
    User.countDocuments(),
    Workshop.countDocuments(),
    Registration.countDocuments()
  ])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare ASMM"
        title="Panou de administrare"
        description="Gestionează workshopurile, utilizatorii, biletele și setările platformei dintr-un singur loc."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="mimesiss-card overflow-hidden">
          <div className="px-5 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-accent/25 bg-primary/20">
                <FaUsers aria-hidden="true" className="h-5 w-5 text-accent" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total utilizatori
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground">
                    {totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="mimesiss-card overflow-hidden">
          <div className="px-5 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-accent/25 bg-primary/20">
                <FaCalendarAlt aria-hidden="true" className="h-5 w-5 text-accent" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total workshop-uri
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground">
                    {totalWorkshops}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="mimesiss-card overflow-hidden">
          <div className="px-5 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-accent/25 bg-primary/20">
                <FaUserPlus aria-hidden="true" className="h-5 w-5 text-accent" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total înregistrări
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-foreground">
                    {totalRegistrations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mimesiss-section-card p-5 sm:p-6" aria-labelledby="admin-quick-actions">
          <h2 id="admin-quick-actions" className="text-xl font-semibold text-foreground">
            Acțiuni rapide
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Accesează cele mai folosite zone de administrare.</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/admin/workshops"
              className="inline-flex min-h-12 items-center rounded-lg border border-accent/25 bg-primary/15 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/45 hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FaCalendarAlt aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Workshopuri
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FaUsers aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Utilizatori
            </Link>
            <Link
              href="/admin/proiecte"
              className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FaFolderOpen aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Proiecte și anunțuri
            </Link>
            <Link href="/admin/galerie" className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <FaImages aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Galerie MIMESISS
            </Link>
            <Link href="/admin/parteneri" className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <FaUsers aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Parteneri și sponsori
            </Link>
            <Link
              href="/admin/tickets"
              className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FaTicketAlt aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Bilete
            </Link>
            <Link href="/admin/payments" className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <FaCreditCard aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Plăți
            </Link>
            <Link href="/admin/settings" className="inline-flex min-h-12 items-center rounded-lg border border-border bg-background/35 px-4 py-3 text-sm font-semibold text-foreground transition hover:border-accent/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <FaCog aria-hidden="true" className="mr-3 h-4 w-4 text-accent" />
              Setări
            </Link>
          </div>
      </section>

      {/* Recent Activity - Placeholder for now */}
      <section className="mimesiss-section-card p-5 sm:p-6" aria-labelledby="admin-recent-activity">
          <h2 id="admin-recent-activity" className="text-xl font-semibold text-foreground">
            Activitate recentă
          </h2>
          <div className="mt-5 rounded-xl border border-dashed border-border bg-background/25 px-5 py-10 text-center">
              <FaCog aria-hidden="true" className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold text-foreground">În dezvoltare</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Istoricul activității va fi disponibil în curând.
              </p>
          </div>
      </section>
    </div>
  )
}

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FaTicketAlt } from 'react-icons/fa'
import { syncUserWithDatabase } from '@/lib/auth'
import { getAllTickets } from '@/app/admin/tickets/actions'
import PageIntro from '@/components/ui/PageIntro'
import { TicketCard } from './TicketCard'

export default async function AdminTicketsPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  const tickets = await getAllTickets()

  const addTicketAction = (
    <Link
      href="/admin/tickets/new"
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent/50 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <FaTicketAlt aria-hidden="true" className="mr-2 h-4 w-4" />
      Adaugă bilet
    </Link>
  )

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare · Bilete"
        title="Setări bilete"
        description="Configurează tipurile de acces, prețurile, beneficiile incluse și disponibilitatea fiecărui bilet."
        actions={addTicketAction}
      />

      <section aria-labelledby="ticket-list-title" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Catalog</p>
            <h2 id="ticket-list-title" className="mt-1 text-xl font-semibold text-foreground">
              Tipuri de bilete
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {tickets.length} {tickets.length === 1 ? 'bilet configurat' : 'bilete configurate'}
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/70 px-6 py-12 text-center">
            <FaTicketAlt aria-hidden="true" className="mx-auto h-12 w-12 text-accent/70" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Nu există bilete</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Creează primul tip de bilet pentru a defini accesul și beneficiile participanților.
            </p>
            <div className="mt-6">{addTicketAction}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket._id || ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

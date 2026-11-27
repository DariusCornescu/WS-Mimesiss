import { requireRoleOrRedirect } from '@/lib/auth'
import { getAppSettings } from '@/lib/settings'
import SettingsForm from '@/components/admin/SettingsForm'
import PageIntro from '@/components/ui/PageIntro'
import connectDB from '@/lib/mongodb'
import { Ticket } from '@/models'

export default async function AdminSettingsPage() {
  await requireRoleOrRedirect('admin')

  // Get current settings
  const settings = await getAppSettings()
  await connectDB()
  // Tickets that can be the limited offer: workshop tickets that are not add-ons.
  const offerTickets = (await Ticket.find({ category: 'workshop' }).select('title price enabled workshopAccess extraWorkshops').sort({ createdAt: 1 }).lean())
    .filter(ticket => ticket.workshopAccess || !(ticket.extraWorkshops ?? 0))
    .map(ticket => ({ id: String(ticket._id), title: ticket.title, price: ticket.price, enabled: ticket.enabled }))

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare ASMM"
        title="Setările aplicației"
        description="Configurează disponibilitatea workshopurilor, plățile și regulile generale ale platformei."
      />

      <section
        aria-label="Configurarea aplicației"
        className="overflow-hidden rounded-xl border border-border/60 bg-card/85 shadow-lg shadow-background/15 backdrop-blur-sm"
      >
        <SettingsForm initialSettings={settings} offerTickets={offerTickets} />
      </section>
    </div>
  )
}

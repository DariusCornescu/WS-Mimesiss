import { requireRoleOrRedirect } from '@/lib/auth'
import { getAppSettings } from '@/lib/settings'
import SettingsForm from '@/components/admin/SettingsForm'
import PageIntro from '@/components/ui/PageIntro'

export default async function AdminSettingsPage() {
  await requireRoleOrRedirect('admin')

  // Get current settings
  const settings = await getAppSettings()

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
        <SettingsForm initialSettings={settings} />
      </section>
    </div>
  )
}

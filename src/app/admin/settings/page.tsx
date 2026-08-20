import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import { getAppSettings } from '@/lib/settings'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function AdminSettingsPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Get current settings
  const settings = await getAppSettings()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Setări Aplicație</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configurați setările globale pentru platformă.
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-card shadow border border-border rounded-lg">
        <SettingsForm initialSettings={JSON.parse(JSON.stringify(settings))} />
      </div>
    </div>
  )
}

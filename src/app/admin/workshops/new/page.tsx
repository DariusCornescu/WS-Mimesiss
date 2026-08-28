import { requireRoleOrRedirect } from '@/lib/auth'
import { getAppSettings } from '@/lib/settings'
import WorkshopForm from '@/components/admin/WorkshopForm'

export default async function NewWorkshopPage() {
  await requireRoleOrRedirect('admin')

  // Get app settings for defaults
  const settings = await getAppSettings()
  
  return <WorkshopForm mode="create" defaultSettings={settings} />
}

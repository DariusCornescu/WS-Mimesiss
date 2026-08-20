import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import { getAppSettings } from '@/lib/settings'
import WorkshopForm from '@/components/admin/WorkshopForm'

export default async function NewWorkshopPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Get app settings for defaults
  const settings = await getAppSettings()
  
  // Convert Mongoose document to plain object for Client Component
  const plainSettings = JSON.parse(JSON.stringify(settings))

  return <WorkshopForm mode="create" defaultSettings={plainSettings} />
}

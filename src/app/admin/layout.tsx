import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import { syncUserWithDatabase } from '@/lib/auth'
import { User } from '@/types/models'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync Clerk user with our database and get user data
  const user: User = await syncUserWithDatabase(clerkUser)

  // Check if user is admin
  if (user.role !== 'admin') {
    console.log('Admin Layout - Access denied, redirecting')
    redirect('/unauthorized')
  }

  // Serialize user for Client Component
  const serializedUser = JSON.parse(JSON.stringify(user))

  return (
    <div className="bg-background">
      {/* Desktop: Flex layout with sidebar */}
      <div className="hidden lg:flex">
        <DashboardSidebar user={serializedUser} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile/Tablet: Full screen layout with sticky navigation */}
      <div className="lg:hidden min-h-screen flex flex-col">
        <DashboardSidebar user={serializedUser} />
        <main className="flex-1 p-3 sm:p-4 pb-safe">
          {children}
        </main>
      </div>
    </div>
  )
}

import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import { requireRoleOrRedirect } from '@/lib/auth'
import { User } from '@/types/models'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user: User = await requireRoleOrRedirect('admin')

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

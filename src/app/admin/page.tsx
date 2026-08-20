import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FaUsers, FaCalendarAlt, FaUserPlus, FaCog } from 'react-icons/fa'
import Link from 'next/link'
import { syncUserWithDatabase } from '@/lib/auth'
import { User as UserType } from '@/types/models'
import connectDB from '@/lib/mongodb'
import { User, Workshop, Registration } from '@/models'

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
      {/* Header */}
      <div className="bg-card overflow-hidden shadow border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-foreground">Panou Administrare</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestionați workshop-urile, utilizatorii și setările sistemului.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-card overflow-hidden shadow border border-border rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUsers className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total utilizatori
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {totalUsers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow border border-border rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaCalendarAlt className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total workshop-uri
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {totalWorkshops}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow border border-border rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaUserPlus className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total înregistrări
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {totalRegistrations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card shadow border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            Acțiuni rapide
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/workshops"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
            >
              <FaCalendarAlt className="mr-2 h-4 w-4" />
              Gestionează workshop-urile
            </Link>
            <Link
              href="/admin/workshops/new"
              className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent"
            >
              <FaUserPlus className="mr-2 h-4 w-4" />
              Creează workshop nou
            </Link>
            <Link
              href="/debug"
              className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent"
            >
              <FaCog className="mr-2 h-4 w-4" />
              Debug
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent"
            >
              <FaUsers className="mr-2 h-4 w-4" />
              Dashboard utilizator
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity - Placeholder for now */}
      <div className="bg-card shadow border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            Activitate recentă
          </h3>
          <div className="mt-5">
            <div className="text-center py-12">
              <FaCog className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">În dezvoltare</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Istoricul activității va fi disponibil în curând.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

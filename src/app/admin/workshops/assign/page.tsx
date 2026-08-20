import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType } from '@/types/models'
import { ManualAssignmentForm } from '@/components/admin/ManualAssignmentForm'
import { getAllUsers } from '../actions'
import { getAllWorkshops } from '@/app/workshops/actions'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'

export default async function ManualAssignmentPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user: UserType = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Fetch all users and workshops
  const [usersData, workshopsData] = await Promise.all([
    getAllUsers(),
    getAllWorkshops()
  ])

  // Convert to plain objects to avoid serialization issues
  const users = JSON.parse(JSON.stringify(usersData)) as UserType[]

  const workshops = JSON.parse(JSON.stringify(workshopsData))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workshops"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Înapoi la Workshop-uri
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Alocare Manuală Participanți</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alocați manual utilizatori la workshop-uri. Regulile (maxim 2 workshop-uri per utilizator și capacitatea workshop-ului) sunt respectate automat.
        </p>
      </div>

      {/* Assignment Form */}
      <div className="bg-card shadow border border-border rounded-lg p-6">
		<ManualAssignmentForm users={users} workshops={workshops} />
      </div>
    </div>
  )
}

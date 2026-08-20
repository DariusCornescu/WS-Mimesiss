import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { FaCalendarAlt, FaPlus, FaUserPlus } from 'react-icons/fa'
import Link from 'next/link'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType, Workshop as WorkshopType } from '@/types/models'
import connectDB from '@/lib/mongodb'
import { Workshop } from '@/models'
import WorkshopAdminRow from '@/components/admin/WorkshopAdminRow'
import { DownloadReportButton } from '@/components/admin/DownloadReportButton'
import RecountParticipantsButton from '@/components/admin/RecountParticipantsButton'
import { getRegistrations } from '@/app/admin/workshops/actions'

export default async function AdminWorkshopsPage() {
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

  // Fetch all workshops
  const workshops = await Workshop.find({}).sort({ date: 1 }).lean() as unknown as WorkshopType[]

  // Fetch registrations for all workshops and serialize
  const workshopsWithRegistrations = await Promise.all(
    workshops.map(async (workshop) => {
      const registrations = await getRegistrations(workshop._id?.toString() || workshop.id || '')
      return { 
        workshop: JSON.parse(JSON.stringify(workshop)),
        registrations: JSON.parse(JSON.stringify(registrations))
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestionare Workshop-uri</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creați, editați și gestionați workshop-urile.
          </p>
        </div>
        <div className="flex gap-2">
        <Link
          href="/admin/workshops/assign"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-green-600 hover:bg-green-700"
        >
          <FaUserPlus className="mr-2 h-4 w-4" />
          Alocare Manuală
        </Link>

        <Link
          href="/admin/workshops/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
        >
          <FaPlus className="mr-2 h-4 w-4" />
          Workshop nou
        </Link>

        <DownloadReportButton />
        </div>
      </div>

      {/* Workshops List */}
      <div className="bg-card shadow border border-border overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-border">
          {workshopsWithRegistrations && workshopsWithRegistrations.length > 0 ? (
            workshopsWithRegistrations.map(({ workshop, registrations }) => (
              <WorkshopAdminRow 
                key={workshop._id?.toString() || workshop.id || ''} 
                workshop={workshop} 
                registrations={registrations}
              />
            ))
          ) : (
            <li>
              <div className="px-4 py-12 text-center">
                <FaCalendarAlt className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">Niciun workshop</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Începeți prin a crea primul workshop.
                </p>
                <div className="mt-6">
                  <Link
                    href="/admin/workshops/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                  >
                    <FaPlus className="mr-2 h-4 w-4" />
                    Workshop nou
                  </Link>
                </div>
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* Recount Button */}
      <div className="flex justify-end">
        <RecountParticipantsButton />
      </div>
    </div>
  )
}

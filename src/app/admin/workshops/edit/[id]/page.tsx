import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import { User as UserType } from '@/types/models'
import connectDB from '@/lib/mongodb'
import { Workshop } from '@/models'
import WorkshopForm from '@/components/admin/WorkshopForm'
import { Workshop as WorkshopType } from '@/types/models'

interface EditWorkshopPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditWorkshopPage({ params }: EditWorkshopPageProps) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if admin
  const user: UserType = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  // Await params before using
  const { id } = await params

  await connectDB()

  // Fetch the workshop
  const workshop = await Workshop.findById(id).lean() as WorkshopType | null

  if (!workshop) {
    notFound()
  }

  // Prepare workshop data for the form
  const workshopJSON = JSON.parse(JSON.stringify(workshop))

  return <WorkshopForm mode="edit" workshop={workshopJSON} />
}

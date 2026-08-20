import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { Workshop as WorkshopModel, Registration } from '@/models'
import type { Workshop, WorkshopRegistration } from '@/types/models'

export async function GET() {
  try {
    const clerkUser = await currentUser()

    // Connect to database and get workshops
    await connectDB()
    const workshops = await WorkshopModel.find({ status: 'active' }).sort({ date: 1 }).lean()

    // Get user registrations if user is logged in
    let userRegistrations: WorkshopRegistration[] = []
    if (clerkUser) {
      const registrations = await Registration.find({ 
        userId: clerkUser.id,
        status: 'confirmed'
      }).lean()
      
      userRegistrations = registrations.map(reg => ({
        _id: String(reg._id),
        userId: reg.userId,
        workshopId: String(reg.workshopId),
        createdAt: reg.createdAt,
        updatedAt: reg.updatedAt,
        attendance: reg.attendance || { confirmed: false }
      }))
    }

    // Convert workshops with registration status - clean type conversion
    const workshopsWithRegistration: Workshop[] = workshops.map(workshop => {
      const isRegistered = userRegistrations.some(
        reg => reg.workshopId === String(workshop._id)
      )
      
      // Convert and enhance the workshop document with proper field mapping
      return {
        ...workshop,
        _id: String(workshop._id),
        id: String(workshop._id),
        date: workshop.date,
        currentParticipants: workshop.currentParticipants || 0, // Map field name and provide default
        user_registered: isRegistered
      } as unknown as Workshop
    })

    return NextResponse.json(workshopsWithRegistration)
  } catch (error) {
    console.error('Error fetching workshops:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workshops' },
      { status: 500 }
    )
  }
}

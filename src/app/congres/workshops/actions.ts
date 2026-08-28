'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { Workshop, Registration } from '@/models'
import connectDB from '@/lib/mongodb'
import { getAppSettings } from '@/lib/settings'
import type { Workshop as WorkshopType, Registrations } from '@/types/models'
import { registerUserForWorkshop } from '@/lib/registration'
import { getActiveEdition } from '@/lib/editions'

type ActionResult = {
  success: boolean
  error?: string
}

export async function registerForWorkshop(formData: FormData): Promise<ActionResult> {
  const clerkUser = await currentUser()

  const workshopId = formData.get('workshopId') as string
  const action = formData.get('action') as string

  if (!clerkUser) {
    return { success: false, error: 'Authentication required' }
  }

  await connectDB()

  try {
    const appSettings = await getAppSettings()

    if (!appSettings.globalRegistrationEnabled) {
      return { success: false, error: 'Inregistrarile sunt inchise in acest moment' }
    }

    if (action === 'register') {
      const activeEdition = await getActiveEdition()

      const result = await registerUserForWorkshop({
        userId: clerkUser.id,
        activeEditionId: activeEdition?._id ?? null,
        workshopId,
        registrationDeadline: appSettings.registrationDeadline
          ? new Date(appSettings.registrationDeadline)
          : null,
      })

      if (!result.ok) {
        return { success: false, error: result.message }
      }
    } else if (action === 'cancel') {
      if (!appSettings.allowCancelRegistration) {
        return { success: false, error: 'Registration cancellation is not allowed' }
      }

      // Decrement only when a registration was actually deleted, so a double
      // cancel cannot drive the counter down twice.
      const deleted = await Registration.findOneAndDelete({ userId: clerkUser.id, workshopId })

      if (!deleted) {
        return { success: false, error: 'No registration found to cancel' }
      }

      await Workshop.updateOne({ _id: workshopId }, { $inc: { currentParticipants: -1 } })
    }

    // Only revalidate on success
    revalidatePath('/congres/workshops')
    revalidatePath('/dashboard')

    return { success: true }

  } catch (error) {
    console.error('Registration action error:', error)
    return {
      success: false,
      error: 'A apărut o eroare. Te rugăm încearcă din nou.'
    }
  }
}

interface registrationsWithWorkshops extends Registrations {
  workshop: WorkshopType;
  attendance: {
    confirmed: boolean;
    confirmedAt?: Date | string;
    confirmedBy?: string;
  };
}

export async function getMyRegistrations(): Promise<registrationsWithWorkshops[]> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return []
  }

  const userId = clerkUser.id

  await connectDB()

  try {
    // Optimized: Use aggregation with $lookup to join in one query
    const registrationsWithWorkshops = await Registration.aggregate([
      {
        $match: { userId }
      },
      {
        // Convert workshopId string to ObjectId for the lookup
        $addFields: {
          workshopObjectId: { $toObjectId: '$workshopId' }
        }
      },
      {
        $lookup: {
          from: 'workshops',
          localField: 'workshopObjectId',
          foreignField: '_id',
          as: 'workshop'
        }
      },
      {
        $unwind: '$workshop'
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          userId: 1,
          workshopId: { $toString: '$workshopId' },
          'workshop._id': { $toString: '$workshop._id' },
          'workshop.id': { $toString: '$workshop._id' },
          'workshop.title': 1,
          'workshop.description': 1,
          'workshop.date': 1,
          'workshop.time': 1,
          'workshop.location': 1,
          'workshop.maxParticipants': 1,
          'workshop.currentParticipants': 1,
          'workshop.instructor': 1,
          'workshop.status': 1,
          'workshop.wsType': 1,
          'workshop.url': 1,
          'workshop.createdAt': 1,
          'workshop.updatedAt': 1,
          attendance: {
            confirmed: { $ifNull: ['$attendance.confirmed', false] },
            confirmedAt: '$attendance.confirmedAt',
            confirmedBy: '$attendance.confirmedBy'
          }
        }
      }
    ])

    return registrationsWithWorkshops as registrationsWithWorkshops[]

  } catch (error) {
    console.error('Error fetching user registrations:', error)
    return []
  }
}

export async function getWorkshopById(workshopId: string): Promise<WorkshopType | null> {
  // Validate ObjectId format before making database query
  if (!workshopId || workshopId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(workshopId)) {
    console.log('Invalid ObjectId format:', workshopId)
    return null
  }

  await connectDB()

  try {
    const workshop = await Workshop.findById(workshopId).lean()
    return workshop as WorkshopType | null
  } catch (error) {
    console.error('Error fetching workshop by ID:', error)
    return null
  }
}

export async function getIsRegisteredForWorkshop( workshopId: string): Promise<boolean> {


  const clerkUser = await currentUser()

  if (!clerkUser) {
    return false
  }

  await connectDB()

  try {
    const registration = await Registration.findOne({ userId: clerkUser.id, workshopId }).lean()
    return registration !== null
  } catch (error) {
    console.error('Error checking workshop registration:', error)
    return false
  }
}

export async function getAllWorkshops(): Promise<WorkshopType[]> {
  await connectDB()

  try {
    const activeEdition = await getActiveEdition()

    // No active edition = between editions: the public listing is empty
    // by design (WorkshopList renders its empty state).
    if (!activeEdition) {
      return []
    }

    // Use lean() for better performance and select only needed fields
    const workshops = await Workshop
      .find({ status: 'active', editionId: activeEdition._id })
      .select('title description date time location maxParticipants currentParticipants instructor status wsType url createdAt updatedAt')
      .sort({ date: 1 })
      .lean()
      
    // Convert MongoDB _id to string
    return workshops.map(w => ({
      ...w,
      _id: w._id?.toString(),
      id: w._id?.toString(),
    })) as unknown as WorkshopType[]
  } catch (error) {
    console.error('Error fetching workshops:', error)
    return []
  }
}
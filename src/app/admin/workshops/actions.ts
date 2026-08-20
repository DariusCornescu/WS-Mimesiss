'use server'

import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { Workshop, Registration, User } from '@/models'
import connectDB from '@/lib/mongodb'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType, Workshop as WorkshopType, UserWithAttendance } from '@/types/models'

export async function createWorkshop(formData: FormData) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  await connectDB()

  // Extract form data
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const location = formData.get('location') as string
  const instructor = formData.get('instructor') as string
  const maxParticipantsRaw = formData.get('maxParticipants') as string
  const maxParticipants = Number(maxParticipantsRaw)
  const wsType = (formData.get('type') as string) || ''
  const url = (formData.get('url') as string) || ''

  // Validate required fields
  if (!title || !description || !wsType) {
    throw new Error('All required fields must be filled')
  }

  if (!Number.isFinite(maxParticipants) || maxParticipants <= 0) {
    throw new Error('Numărul maxim de participanți este invalid')
  }

  try {
    // Parse and validate date
    let parsedDate = null;
    if (date && date.trim()) {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        parsedDate = dateObj;
      }
    }

    // Validate wsType enum
    const validWsTypes = ['workshop', 'conferinta'];
    const normalizedWsType = wsType?.toLowerCase();
    const finalWsType = validWsTypes.includes(normalizedWsType) ? normalizedWsType : 'workshop';

    // Create the workshop
    const workshop = await Workshop.create({
      title,
      description,
      date: parsedDate,
      time: time || null,
      location: location || '',
      maxParticipants,
      currentParticipants: 0,
      instructor: instructor || '',
      wsType: finalWsType,
      status: 'active',
      url: url || '',
    })

    // Revalidate the admin workshops page
    revalidatePath('/admin/workshops')

    return { success: true, workshopId: workshop._id.toString() }
  } catch (error) {
    console.error('Error creating workshop:', error)
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to create workshop: ' + message)
  }
}

export async function updateWorkshop(workshopId: string, formData: FormData) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  await connectDB()

  // Extract form data
  const title = formData.get('title') as string
  const description = formData.get('description') as string ?? ''
  const date = formData.get('date') as string ?? ''
  const time = formData.get('time') as string ?? ''
  const location = formData.get('location') as string ?? ''
  const instructor = formData.get('instructor') as string ?? ''
  const maxParticipants = parseInt(formData.get('maxParticipants') as string) ?? 0
  const wsType = formData.get('type') as string ?? 'workshop'
  const url = formData.get('url') as string ?? ''

  console.log('updateWorkshop: received url=', url)

  // Validate required fields
  if (!title || !description || !maxParticipants) {
    throw new Error('All required fields must be filled')
  }

  try {
    // Get the existing workshop to check current participants
    const existingWorkshop = await Workshop.findById(workshopId)

    if (!existingWorkshop) {
      throw new Error('Workshop not found')
    }

    // Validate that max participants is not less than current participants
    if (maxParticipants < existingWorkshop.currentParticipants) {
      throw new Error(`Maximum participants cannot be less than current participants (${existingWorkshop.currentParticipants})`)
    }

    // Parse and validate date
    let parsedDate = null;
    if (date && date.trim()) {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        parsedDate = dateObj;
      }
    }

    // Validate wsType enum
    const validWsTypes = ['workshop', 'conferinta'];
    const normalizedWsType = wsType?.toLowerCase();
    const finalWsType = validWsTypes.includes(normalizedWsType) ? normalizedWsType : 'workshop';

    // Update the workshop
    const workshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        title,
        description,
        date: parsedDate,
        time: time || null,
        location: location || '',
        maxParticipants,
        instructor: instructor || '',
        wsType: finalWsType,
        url: url || '',
      },
      { new: true }
    )

    if (!workshop) {
      throw new Error('Workshop not found')
    }

    // Revalidate the admin workshops page
    revalidatePath('/admin/workshops')

    return { success: true, workshopId: workshop._id.toString() }
  } catch (error) {
    console.error('Error updating workshop:', error)
    throw new Error('Failed to update workshop')
  }
}

export async function deleteWorkshop(workshopId: string) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  await connectDB()

  try {
    // First, delete all registrations for this workshop
    await Registration.deleteMany({ workshopId })

    // Then delete the workshop
    const workshop = await Workshop.findByIdAndDelete(workshopId)

    if (!workshop) {
      throw new Error('Workshop not found')
    }

    // Revalidate the admin workshops page
    revalidatePath('/admin/workshops')

    return { success: true }
  } catch (error) {
    console.error('Error deleting workshop:', error)
    throw new Error('Failed to delete workshop')
  }
}


export async function getRegistrations(workshopId: string): Promise<UserWithAttendance[]> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  await connectDB()

  try {
    const registrations = await Registration.find({ workshopId }).lean()

    const users = await User.find({
      clerkId: { $in: registrations.map(reg => reg.userId) }
    }).lean<UserType[]>()

    // Map users with their attendance information
    const usersWithAttendance: UserWithAttendance[] = users.map((user) => {
      const registration = registrations.find(reg => reg.userId === user.clerkId)
      return {
        _id: String(user._id),
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        userType: user.userType,
        attendance: registration?.attendance || { confirmed: false }
      }
    })

    return usersWithAttendance
  } catch (error) {
    console.error('Error fetching registrations:', error)
    throw new Error('Failed to fetch registrations')
  }
}

export async function generateWorkshopsReport(): Promise<string> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  await connectDB()

  try {
    // Get the current host from headers
    const headersList = await headers()
    const host = headersList.get('host') || 'mimesiss.ro'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Fetch all workshops with their registrations
    const workshopsData = await Workshop.find({}).sort({ date: 1 }).lean() as unknown as WorkshopType[]

    // Build CSV content
    const csvRows: string[] = []
    
    // CSV Header
    csvRows.push('Workshop Name,Type,Link,User First Name,User Last Name,User Email')

    // Process each workshop
    for (const workshop of workshopsData) {
      const workshopId = String(workshop._id || workshop.id || '')
      
      // Get registrations for this workshop with user details
      const registrationsWithUsers = await Registration.aggregate([
        {
          $match: { workshopId }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'clerkId',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            'user.firstName': 1,
            'user.lastName': 1,
            'user.email': 1
          }
        }
      ])

      const workshopName = `"${(workshop.title || '').replace(/"/g, '""')}"` // Escape quotes
      const workshopType = `"${(workshop.wsType || '').replace(/"/g, '""')}"` // Escape quotes
      const workshopLink = `"${baseUrl}/workshops/${workshop._id}"`

      if (registrationsWithUsers.length === 0) {
        // Workshop with no registrations
        csvRows.push(`${workshopName},${workshopType},${workshopLink},,,`)
      } else {
        // Add a row for each registered user
        for (const reg of registrationsWithUsers) {
          const firstName = `"${(reg.user?.firstName || '').replace(/"/g, '""')}"`
          const lastName = `"${(reg.user?.lastName || '').replace(/"/g, '""')}"`
          const email = `"${(reg.user?.email || '').replace(/"/g, '""')}"`
          
          csvRows.push(`${workshopName},${workshopType},${workshopLink},${firstName},${lastName},${email}`)
        }
      }
    }

    return csvRows.join('\n')
  } catch (error) {
    console.error('Error generating workshops report:', error)
    throw new Error('Failed to generate report')
  }
}

type ManualAssignResult = {
  success: boolean
  error?: string
}

export async function manuallyAssignUserToWorkshop(
  userId: string,
  workshopId: string
): Promise<ManualAssignResult> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return { success: false, error: 'Authentication required' }
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  await connectDB()

  try {
    // Get workshop details
    const workshopDoc = await Workshop.findById(workshopId)
      .select('wsType maxParticipants currentParticipants')
      .lean()

    const workshop = workshopDoc as unknown as WorkshopType

    if (!workshop) {
      return { success: false, error: 'Workshop not found' }
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({ userId, workshopId }).lean()

    if (existingRegistration) {
      return { success: false, error: 'User is already registered for this workshop' }
    }

    // For workshops (not conferences), enforce limits
    if (workshop.wsType !== 'conferinta') {
      // Check user's workshop count using aggregation
      const [validationResult] = await Registration.aggregate([
        {
          $facet: {
            // Check user's workshop count
            userWorkshops: [
              {
                $match: {
                  userId,
                  workshopId: { $ne: workshopId }
                }
              },
              {
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
                $match: {
                  'workshop.wsType': 'workshop'
                }
              },
              {
                $count: 'total'
              }
            ],
            // Check current workshop registrations
            workshopRegistrations: [
              {
                $match: { workshopId }
              },
              {
                $count: 'total'
              }
            ]
          }
        }
      ])

      const userWorkshopCount = validationResult?.userWorkshops[0]?.total || 0
      const currentRegistrations = validationResult?.workshopRegistrations[0]?.total || 0

      // Validate user workshop limit
      if (userWorkshopCount >= 2) {
        return { success: false, error: 'User is already registered for 2 workshops (maximum allowed)' }
      }

      // Validate workshop capacity
      if (currentRegistrations >= workshop.maxParticipants) {
        return { success: false, error: 'Workshop is at full capacity' }
      }
    }

    // Create registration
    await Registration.create({
      userId,
      workshopId,
      status: 'confirmed'
    })

    // Update participant count with atomic increment
    await Workshop.findByIdAndUpdate(workshopId, {
      $inc: { currentParticipants: 1 }
    })

    revalidatePath('/admin/workshops')
    revalidatePath('/workshops')
    
    return { success: true }

  } catch (error) {
    console.error('Error removing user from workshop:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove user from workshop' 
    }
  }
}

export async function recountAllWorkshopParticipants() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return { success: false, error: 'Authentication required' }
  }

  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  try {
    await connectDB()

    // Get all workshops
    const workshops = await Workshop.find({}).select('_id')

    let updated = 0

    // For each workshop, count registrations and update currentParticipants
    for (const workshop of workshops) {
      const count = await Registration.countDocuments({ 
        workshopId: workshop._id.toString() 
      })

      await Workshop.findByIdAndUpdate(
        workshop._id,
        { currentParticipants: count },
        { new: true }
      )

      updated++
    }

    revalidatePath('/admin/workshops')

    return { 
      success: true, 
      message: `Successfully recounted ${updated} workshops` 
    }

  } catch (error) {
    console.error('Error recounting participants:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to recount participants' 
    }
  }
}

export async function getAllUsers(): Promise<UserType[]> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new Error('Authentication required')
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  await connectDB()

  try {
    const usersData = await User.find({})
      .select('clerkId email firstName lastName role userType')
      .lean()
      .exec()

    return usersData as unknown as UserType[]
  } catch (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }
}

type RemoveUserResult = {
  success: boolean
  error?: string
}

export async function removeUserFromWorkshop(
  userId: string,
  workshopId: string
): Promise<RemoveUserResult> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    return { success: false, error: 'Authentication required' }
  }

  // Sync user and check if admin
  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    return { success: false, error: 'Admin access required' }
  }

  await connectDB()

  try {
    // Check if registration exists
    const registration = await Registration.findOne({ userId, workshopId })

    if (!registration) {
      return { success: false, error: 'User is not registered for this workshop' }
    }

    // Delete registration and decrement participant count atomically
    await Promise.all([
      Registration.findOneAndDelete({ userId, workshopId }),
      Workshop.findByIdAndUpdate(workshopId, {
        $inc: { currentParticipants: -1 }
      })
    ])

    revalidatePath('/admin/workshops')
    revalidatePath('/workshops')
    
    return { success: true }

  } catch (error) {
    console.error('Error removing user from workshop:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove user from workshop' 
    }
  }
}
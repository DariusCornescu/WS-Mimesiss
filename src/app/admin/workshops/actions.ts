'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { Workshop, Registration, User } from '@/models'
import connectDB from '@/lib/mongodb'
import { requireRole, requireRoleAction } from '@/lib/auth'
import type { User as UserType, Workshop as WorkshopType, UserWithAttendance } from '@/types/models'
import { registerUserForWorkshop } from '@/lib/registration'
import { getActiveEdition } from '@/lib/editions'
import { parseWith, workshopInput } from '@/lib/validation'

export async function createWorkshop(formData: FormData) {
  await requireRole('admin')

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

  const parsed = parseWith(workshopInput, {
    title,
    description,
    maxParticipants,
    wsType: (wsType || 'workshop').toLowerCase(),
    url,
  })

  if (!parsed.ok) {
    throw new Error(parsed.error)
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

    // Workshops belong to the active edition; refuse to create orphans
    // that no public listing would ever show.
    const activeEdition = await getActiveEdition()
    if (!activeEdition) {
      throw new Error('Nu există o ediție activă. Marchează o ediție ca activă (db.editions.updateOne({year: N}, {$set: {status: "active"}})) înainte de a crea workshopuri.')
    }

    // Create the workshop
    const workshop = await Workshop.create({
      title: parsed.data.title,
      description: parsed.data.description,
      date: parsedDate,
      time: time || null,
      location: location || '',
      maxParticipants: parsed.data.maxParticipants,
      currentParticipants: 0,
      instructor: instructor || '',
      wsType: parsed.data.wsType,
      status: 'active',
      editionId: activeEdition._id,
      url: url || '',
    })

    // Revalidate the admin workshops page
    revalidatePath('/admin/workshops')

    return { success: true, workshopId: String(workshop._id) }
  } catch (error) {
    console.error('Error creating workshop:', error)
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error('Failed to create workshop: ' + message)
  }
}

export async function updateWorkshop(workshopId: string, formData: FormData) {
  await requireRole('admin')

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

  const parsed = parseWith(workshopInput, {
    title,
    description,
    maxParticipants,
    wsType: (wsType || 'workshop').toLowerCase(),
    url,
  })

  if (!parsed.ok) {
    throw new Error(parsed.error)
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

    // Update the workshop
    const workshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        date: parsedDate,
        time: time || null,
        location: location || '',
        maxParticipants: parsed.data.maxParticipants,
        instructor: instructor || '',
        wsType: parsed.data.wsType,
        url: url || '',
      },
      { new: true }
    )

    if (!workshop) {
      throw new Error('Workshop not found')
    }

    // Revalidate the admin workshops page
    revalidatePath('/admin/workshops')

    return { success: true, workshopId: String(workshop._id) }
  } catch (error) {
    console.error('Error updating workshop:', error)
    throw new Error('Failed to update workshop')
  }
}

export async function deleteWorkshop(workshopId: string) {
  await requireRole('admin')

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
  await requireRole('admin')

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
  await requireRole('admin')

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
  const denied = await requireRoleAction('admin')

  if (denied) {
    return denied
  }

  await connectDB()

  try {
    const result = await registerUserForWorkshop({
      userId,
      workshopId,
      adminOverride: true,
    })

    if (!result.ok) {
      return { success: false, error: result.message }
    }

    revalidatePath('/admin/workshops')
    revalidatePath('/congres/workshops')
    
    return { success: true }

  } catch (error) {
    console.error('Error assigning user to workshop:', error)
    return { 
      success: false, 
      error: 'Nu am putut înscrie utilizatorul la workshop' 
    }
  }
}

export async function recountAllWorkshopParticipants() {
  const denied = await requireRoleAction('admin')

  if (denied) {
    return denied
  }

  try {
    await connectDB()

    // One aggregate + one bulkWrite instead of two queries per workshop.
    // Scope to the active edition when one exists; with none, repair all
    // (which also fixes drift on archived editions).
    const activeEdition = await getActiveEdition()
    const scope = activeEdition ? { editionId: activeEdition._id } : {}
    const workshops = await Workshop.find(scope).select('_id').lean()
    const workshopIds = workshops.map(w => String(w._id))

    const counts = await Registration.aggregate([
      { $match: { workshopId: { $in: workshopIds } } },
      { $group: { _id: '$workshopId', total: { $sum: 1 } } },
    ])
    const countByWorkshop = new Map<string, number>(counts.map(c => [String(c._id), c.total]))

    if (workshops.length > 0) {
      await Workshop.bulkWrite(workshops.map(w => ({
        updateOne: {
          filter: { _id: w._id },
          update: { $set: { currentParticipants: countByWorkshop.get(String(w._id)) ?? 0 } },
        },
      })))
    }

    const updated = workshops.length

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
  await requireRole('admin')

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
  const denied = await requireRoleAction('admin')

  if (denied) {
    return denied
  }

  await connectDB()

  try {
    // Decrement only when a registration was actually deleted, so a double
    // remove cannot drive the counter down twice.
    const deleted = await Registration.findOneAndDelete({ userId, workshopId })

    if (!deleted) {
      return { success: false, error: 'User is not registered for this workshop' }
    }

    await Workshop.updateOne({ _id: workshopId }, { $inc: { currentParticipants: -1 } })

    revalidatePath('/admin/workshops')
    revalidatePath('/congres/workshops')
    
    return { success: true }

  } catch (error) {
    console.error('Error removing user from workshop:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove user from workshop' 
    }
  }
}
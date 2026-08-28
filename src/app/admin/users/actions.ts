'use server'

import { currentUser } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { UserRole, UserType, User as UserInterface } from '@/types/models'
import { parseWith, userRoleInput } from '@/lib/validation'

// Type definitions for update operations
interface UserUpdateData {
  role: UserRole
  userType?: UserType | null
}

interface ClerkMetadataUpdate {
  role: UserRole
  userType?: UserType | null
  [key: string]: string | null | undefined
}

export async function updateUserRole(formData: FormData) {
  try {
    // Check if current user is admin
    const clerkUser = await currentUser()
    if (!clerkUser) {
      redirect('/auth/login')
    }

    await requireRole('admin')

    const parsed = parseWith(userRoleInput, {
      userId: formData.get('userId'),
      role: formData.get('role'),
      userType: formData.get('userType') ?? undefined,
    })

    if (!parsed.ok) {
      throw new Error(parsed.error)
    }

    const { userId, userType } = parsed.data
    const newRole = parsed.data.role

    // Don't allow changing own role
    if (userId === clerkUser.id) {
      throw new Error('Nu vă puteți modifica propriile date.')
    }

    await connectDB()

    // Prepare update data
    const updateData: UserUpdateData = { role: newRole }

    if (userType !== undefined) {
      updateData.userType = (userType as UserType) || null
    }

    // Update user data in MongoDB
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      updateData,
      { new: true, upsert: true }
    )

    if (!updatedUser) {
      throw new Error('Utilizatorul nu a fost găsit.')
    }

    // Update role in Clerk's public metadata
    const client = await clerkClient()
    const metadataUpdate: ClerkMetadataUpdate = { role: newRole }

    if (userType !== undefined) {
      metadataUpdate.userType = (userType as UserType) || null
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: metadataUpdate
    })

    // Build success message
    const updates = []
    updates.push(`rol: ${newRole === 'admin' ? 'Administrator' : 'Utilizator'}`)

    if (userType !== undefined) {
      updates.push(`tip: ${userType || 'nespecificat'}`)
    }

    return {
      success: true,
      message: `Datele utilizatorului au fost actualizate cu succes (${updates.join(', ')}).`
    }
  } catch (error) {
    console.error('Error updating user:', error)
    throw new Error(error instanceof Error ? error.message : 'A apărut o eroare la actualizarea datelor utilizatorului.')
  }
}

export async function deleteUser(formData: FormData) {
  try {
    // Check if current user is admin
    const clerkUser = await currentUser()
    if (!clerkUser) {
      redirect('/auth/login')
    }

    await requireRole('admin')

    const parsed = parseWith(userRoleInput.pick({ userId: true }), {
      userId: formData.get('userId'),
    })

    if (!parsed.ok) {
      throw new Error(parsed.error)
    }

    const { userId } = parsed.data

    // Don't allow deleting own account
    if (userId === clerkUser.id) {
      throw new Error('Nu vă puteți șterge propriul cont.')
    }

    await connectDB()

    // Check if user to be deleted is admin
    const userToDelete = await User.findOne({ clerkId: userId })
    if (userToDelete?.role === 'admin') {
      // Count total admins
      const adminCount = await User.countDocuments({ role: 'admin' })
      if (adminCount <= 1) {
        throw new Error('Nu puteți șterge ultimul administrator din sistem.')
      }
    }

    // Delete user from MongoDB first
    await User.findOneAndDelete({ clerkId: userId })

    // Delete user from Clerk
    const client = await clerkClient()
    await client.users.deleteUser(userId)

    return {
      success: true,
      message: 'Utilizatorul a fost șters cu succes din sistemul de autentificare și baza de date.'
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw new Error(error instanceof Error ? error.message : 'A apărut o eroare la ștergerea utilizatorului.')
  }
}

export async function fetchAllUsers() {
  // Check if current user is admin
  const clerkUser = await currentUser()
  if (!clerkUser) {
    redirect('/auth/login')
  }

  await requireRole('admin')

  await connectDB()

  // Use lean() for better performance and select only needed fields
  const users = await User
    .find({})
    .select('clerkId firstName lastName email role userType createdAt updatedAt')
    .lean()

  const usersJSON = JSON.parse(JSON.stringify(users)) as UserInterface[];

  return usersJSON;
}
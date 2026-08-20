import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { User as UserInterface } from '@/types/models'
import { isUserAdmin } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isUserAdminRole = await isUserAdmin(clerkUser.id)
    if (!isUserAdminRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get users from MongoDB
    await connectDB()
    const mongoUsers = await User.find({}).lean()

    // Get all users from Clerk
    const clerkUsers = await (await clerkClient()).users.getUserList({
      limit: 500, // Adjust as needed
    })

    // Combine Clerk and MongoDB data using User interface
    const users: UserInterface[] = clerkUsers.data.map((clerkUser) => {
      const mongoUser = mongoUsers.find((u) => u.clerkId === clerkUser.id)
      
      return {
        _id: mongoUser?._id?.toString() || '',
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        role: mongoUser?.role || 'user',
        createdAt: mongoUser?.createdAt || new Date(clerkUser.createdAt),
        updatedAt: mongoUser?.updatedAt || new Date(clerkUser.updatedAt || clerkUser.createdAt),
        userType: mongoUser?.userType || 'student',
      }
    })

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
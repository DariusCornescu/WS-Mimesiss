import { User as ClerkUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User as MongoUser } from '@/models'
import { User } from '@/types/models'

/**
 * Sync Clerk user with our database
 * This function ensures every Clerk user has a corresponding record in our MongoDB
 */
export async function syncUserWithDatabase(clerkUser: ClerkUser): Promise<User> {
  await connectDB()

  try {
    // First, check if user already exists to preserve their role
    const existingUser = await MongoUser.findOne({ clerkId: clerkUser.id }).lean() as User | null

    // Determine the role: use Clerk's publicMetadata if set, otherwise preserve existing role or default to 'user'
    const role = clerkUser.publicMetadata?.role || existingUser?.role || 'user'

    // Use findOneAndUpdate with upsert to avoid duplicate key errors
    const user = await MongoUser.findOneAndUpdate(
      { clerkId: clerkUser.id },
      {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || existingUser?.firstName || '',
        lastName: clerkUser.lastName || existingUser?.lastName || '',
        role: role, // Preserve existing role or use Clerk's metadata
        userType: clerkUser.unsafeMetadata?.userType || existingUser?.userType || 'student', // Default to 'student' if not set
      },
      {
        upsert: true, // Create if doesn't exist
        new: true,    // Return the updated document
        runValidators: true,
      }
    ).lean() as User | null

    if (!user) {
      throw new Error('Failed to create or update user')
    }

    // return the user in our defined User type
    return user;

  } catch (error) {
    console.error('Error syncing user with database:', error)

    // If it's a duplicate key error, try to find the existing user
    if (error instanceof Error && error.message.includes('E11000')) {
      const existingUser = await MongoUser.findOne({ clerkId: clerkUser.id }).lean() as User | null
      if (existingUser) {
        return existingUser;
      }
    }

    throw error
  }
}

/**
 * Get user role from our database
 */
export async function getUserRole(clerkUserId: string): Promise<'user' | 'admin'> {
  await connectDB()

  const user = await MongoUser.findOne({ clerkId: clerkUserId })
  return user?.role || 'user'
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(clerkUserId: string): Promise<boolean> {
  const role = await getUserRole(clerkUserId)
  return role === 'admin'
}

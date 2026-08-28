import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'
import { currentUser, User as ClerkUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User as MongoUser } from '@/models'
import { User, UserRole } from '@/types/models'

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

/**
 * Error thrown by requireRole when the caller is unauthenticated (401) or
 * lacks the required role (403). Route handlers convert it with
 * toAuthResponse(); pages should use requireRoleOrRedirect() instead.
 */
export class AuthError extends Error {
  constructor(public readonly status: 401 | 403, message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Single authorization gate for route handlers, server actions and pages.
 * Resolves the Clerk user, syncs it into Mongo (which also establishes the
 * DB connection) and asserts the role against the database — roles live in
 * Mongo, never in Clerk claims. Throws AuthError on failure.
 */
export async function requireRole(...roles: UserRole[]): Promise<User> {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    throw new AuthError(401, 'Autentificare necesară')
  }

  const user = await syncUserWithDatabase(clerkUser)

  if (!roles.includes(user.role)) {
    throw new AuthError(403, 'Nu ai permisiunea necesară')
  }

  return user
}

/**
 * Route-handler adapter: returns a NextResponse for an AuthError, null for
 * anything else (so existing catch blocks keep handling their own errors).
 */
export function toAuthResponse(error: unknown): NextResponse | null {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return null
}

/**
 * Page adapter: same gate, but redirects the way the pages do today —
 * unauthenticated to the login page, wrong role to /unauthorized.
 */
export async function requireRoleOrRedirect(...roles: UserRole[]): Promise<User> {
  try {
    return await requireRole(...roles)
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(error.status === 401 ? '/auth/login' : '/unauthorized')
    }
    throw error
  }
}

/**
 * ActionResult adapter for actions that return { success, error } instead of
 * throwing: null when allowed, the ready-made error result when not.
 */
export async function requireRoleAction(
  ...roles: UserRole[]
): Promise<{ success: false; error: string } | null> {
  try {
    await requireRole(...roles)
    return null
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message }
    }
    throw error
  }
}

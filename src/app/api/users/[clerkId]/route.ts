import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import { User as UserInterface } from '@/types/models'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clerkId: string }> }
) {
  try {
    // Await the params
    const { clerkId } = await params
    
    // Verify the requesting user is authenticated
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only access their own data (security check)
    if (clerkUser.id !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectDB()

    // Find the user in MongoDB
    const mongoUser = await User.findOne({ clerkId }).lean() as UserInterface | null

	if (!mongoUser) {
	  return NextResponse.json({ error: 'User not found' }, { status: 404 })
	}

    return NextResponse.json(mongoUser)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
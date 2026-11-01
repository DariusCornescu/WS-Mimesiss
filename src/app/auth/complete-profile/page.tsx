import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb'
import { User } from '@/models'
import type { User as UserRecord } from '@/types/models'
import CompleteProfileForm from '@/components/auth/CompleteProfileForm'
import { isUserType, registrationProfile } from '@/lib/registration-profile'

export default async function CompleteProfilePage() {
  const user = await currentUser()
  if (!user) redirect('/auth/login')
  await connectDB()
  const existing = await User.findOne({ clerkId: user.id }).lean() as UserRecord | null
  const userType = existing?.userType
  if (registrationProfile(existing)) redirect('/dashboard')
  return <CompleteProfileForm firstName={user.firstName || existing?.firstName || ''} lastName={user.lastName || existing?.lastName || ''} userType={isUserType(userType) ? userType : ''} />
}

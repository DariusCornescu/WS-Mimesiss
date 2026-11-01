import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AccountLayout from '@/components/dashboard/AccountLayout'
import { syncUserWithDatabase } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync Clerk user with our database and get user data
  const user = await syncUserWithDatabase(clerkUser)
  
  const navigationUser = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }

  return <AccountLayout user={navigationUser}>{children}</AccountLayout>
}

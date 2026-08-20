import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { isUserAdmin } from '@/lib/auth'
import { fetchAllUsers } from './actions'
import UserListWrapper from '@/components/ui/UserListWrapper' // Ensure this path is correct

export default async function AdminUsersPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  const isUserAdminRole = await isUserAdmin(clerkUser.id)
  if (!isUserAdminRole) {
    redirect('/unauthorized')
  }

  const users = await fetchAllUsers();

  // Sort by creation date (newest first)
  users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  // All UI is now handled by the client component
  // Just pass the initial data to it
  return (
    <UserListWrapper
      initialUsers={users}
      currentUserId={clerkUser.id}
    />
  )
}
import AccountLayout from '@/components/dashboard/AccountLayout'
import { requireRoleOrRedirect } from '@/lib/auth'
import { User } from '@/types/models'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user: User = await requireRoleOrRedirect('admin')

  const navigationUser = {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }

  return <AccountLayout user={navigationUser}>{children}</AccountLayout>
}

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType } from '@/types/models'
import QRScanner from '@/components/QRScanner'

export default async function ScannerPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if moderator or admin
  const user: UserType = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'moderator' && user.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Scanner Cod QR</h1>
          <p className="mt-2 text-muted-foreground">
            Scanați QR-ul de pe biletul emis pentru validare la intrare
          </p>
        </div>

        <QRScanner />
      </div>
    </div>
  )
}

import { currentUser } from '@clerk/nextjs/server'
import { FaCalendarAlt, FaUsers, FaCog, FaCalendarCheck, FaTicketAlt, FaShoppingCart } from 'react-icons/fa'
import Link from 'next/link'
import { syncUserWithDatabase } from '@/lib/auth'
import SimpleUserQRCode from '@/components/SimpleUserQRCode'
import { getAppSettings } from '@/lib/settings'
import connectDB from '@/lib/mongodb'
import { Payment } from '@/models'

export default async function DashboardPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) return null


  // Sync user with database
  const user = await syncUserWithDatabase(clerkUser)
  const appSettings = await getAppSettings()
  const isBallMode = appSettings?.eventMode === 'ball'

  // Ticket purchase status
  await connectDB()
  let ticketsOwned = 0
  let ticketsRemaining: number | null = null

  if (isBallMode) {
    const ballPayments = await Payment.find({
      clerkId: user.clerkId,
      ticketCategory: 'ball',
      status: 'completed',
    }).lean()
    ticketsOwned = ballPayments.reduce((sum, p) => sum + ((p as { quantity?: number }).quantity || 1), 0)
    const max = appSettings?.ballMaxTicketsPerUser ?? 2
    ticketsRemaining = Math.max(0, max - ticketsOwned)
  } else {
    const workshopPayment = await Payment.findOne({
      clerkId: user.clerkId,
      status: 'completed',
      $or: [{ ticketCategory: 'workshop' }, { ticketCategory: { $exists: false } }],
    }).lean()
    ticketsOwned = workshopPayment ? 1 : 0
    ticketsRemaining = workshopPayment ? 0 : 1
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-card overflow-hidden shadow-lg border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-foreground">
            Bine ai venit, {clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : clerkUser.emailAddresses?.[0]?.emailAddress}!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Iată ce se întâmplă cu workshopurile tale astăzi.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mimesiss-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FaTicketAlt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isBallMode ? 'Bilete Bal' : 'Bilet eveniment'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {ticketsOwned > 0
                  ? isBallMode
                    ? `${ticketsOwned} bilet${ticketsOwned > 1 ? 'e' : ''} cumpărat${ticketsOwned > 1 ? 'e' : ''}`
                    : 'Bilet achiziționat'
                  : 'Niciun bilet achiziționat'}
              </p>
            </div>
          </div>

          {ticketsRemaining !== null && ticketsRemaining > 0 ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {isBallMode
                  ? `Mai poți cumpăra ${ticketsRemaining} bilet${ticketsRemaining > 1 ? 'e' : ''}`
                  : 'Disponibil pentru cumpărare'}
              </span>
              <Link
                href="/payment"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
              >
                <FaShoppingCart className="h-3 w-3" />
                Cumpără
              </Link>
            </div>
          ) : (
            <span className="text-sm font-medium text-green-500">
              {isBallMode ? 'Limită atinsă' : 'Complet'}
            </span>
          )}
        </div>
        <Link href="/dashboard/tickets" className="text-xs text-primary hover:underline">
          Vezi toate biletele mele →
        </Link>
      </div>


      {/* User QR Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SimpleUserQRCode
            userId={clerkUser.id}
            userName={clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : undefined}
          />
        </div>
        <div className="space-y-4">
          <div className="mimesiss-card p-4">
            <h4 className="font-semibold text-foreground mb-2">Cum funcționează?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Administratorii scanează codul tău QR</li>
              <li>• Prezența ta este confirmată automat</li>
              <li>• Poți descărca codul pentru uz personal</li>
            </ul>
          </div>
          <div className="mimesiss-card p-4">
            <h4 className="font-semibold text-foreground mb-2">Informații Profil</h4>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Tip utilizator:</span>
                <span className="ml-2 font-medium text-foreground">{user.userType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Rol:</span>
                <span className="ml-2 font-medium text-foreground">
                  {user.role === 'admin' ? 'Administrator' : 'Utilizator'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card shadow border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            Acțiuni rapide
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {!isBallMode && (
              <Link href="/workshops"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
              >
                <FaCalendarAlt className="mr-2 h-4 w-4" />
                 Workshop-uri
              </Link>
            )}
            {!isBallMode && (
              <Link href="/dashboard/registrations" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90">
                <FaCalendarCheck className="mr-2 h-4 w-4" />
                Înregistrările mele
              </Link>
            )}
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent"
            >
              <FaCog className="mr-2 h-4 w-4" />
              Editează profilul
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200"
              >
                <FaUsers className="mr-2 h-4 w-4" />
                Panou Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

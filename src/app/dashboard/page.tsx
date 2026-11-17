import { currentUser } from '@clerk/nextjs/server'
import { FaCalendarAlt, FaUsers, FaCog, FaCalendarCheck, FaQrcode, FaTicketAlt } from 'react-icons/fa'
import Link from 'next/link'
import { syncUserWithDatabase } from '@/lib/auth'
import SimpleUserQRCode from '@/components/SimpleUserQRCode'
import { getAppSettings } from '@/lib/settings'
import connectDB from '@/lib/mongodb'
import { IssuedTicket, Payment, Registration } from '@/models'
import PageIntro from '@/components/ui/PageIntro'

/**
 * The attendance QR identifies a person, so it is only generated once there is
 * something for them to attend: a ticket that has not been cancelled, a manual
 * payment recorded by the organisers (those have no issued tickets), or a
 * registration such as a free conference.
 */
async function hasSomethingToAttend(clerkId: string) {
  const [liveTicket, registration] = await Promise.all([
    IssuedTicket.exists({ clerkId, status: { $ne: 'cancelled' } }),
    Registration.exists({ userId: clerkId }),
  ])
  if (liveTicket || registration) return true

  const payments = await Payment.find({ clerkId, status: 'completed' }).select('_id').lean()
  for (const payment of payments) {
    if (!(await IssuedTicket.exists({ paymentId: String(payment._id) }))) return true
  }
  return false
}

export default async function DashboardPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) return null

  // Sync user with database
  const user = await syncUserWithDatabase(clerkUser)
  const appSettings = await getAppSettings()
  const isBallMode = appSettings?.eventMode === 'ball'

  await connectDB()
  const showQr = await hasSomethingToAttend(user.clerkId)

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Spațiul personal"
        title={<>Bine ai venit, {clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : clerkUser.emailAddresses?.[0]?.emailAddress}!</>}
        description="De aici îți gestionezi profilul, înscrierile și biletele pentru evenimentele ASMM."
      />

      {/* User QR Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {showQr ? (
            <SimpleUserQRCode
              userId={clerkUser.id}
              userName={clerkUser.firstName && clerkUser.lastName ? `${clerkUser.firstName} ${clerkUser.lastName}` : undefined}
            />
          ) : (
            <div className="mimesiss-card flex flex-col items-center gap-3 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FaQrcode className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Încă nu ai un cod QR</h3>
              <p className="max-w-md text-sm text-muted-foreground">
                Codul tău QR de prezență apare aici după ce cumperi un bilet sau te înscrii la un eveniment.
                Până atunci nu generăm niciun cod pentru contul tău.
              </p>
              {appSettings?.paymentsEnabled && (
                <Link href="/payment" className="mimesiss-btn-primary mt-2 inline-flex items-center gap-2">
                  <FaTicketAlt className="h-4 w-4" />
                  Cumpără bilet
                </Link>
              )}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="mimesiss-card p-4">
            <h4 className="font-semibold text-foreground mb-2">Cum funcționează?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Codul apare după ce ai un bilet sau o înscriere</li>
              <li>• Organizatorii îl scanează la intrare</li>
              <li>• Prezența ta este confirmată automat</li>
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
              <Link href="/congres/workshops"
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
              className="inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <FaCog className="mr-2 h-4 w-4" />
              Editează profilul
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-accent/50 text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
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

import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import type { User as UserType } from '@/types/models'
import { FaQrcode } from 'react-icons/fa'
import Link from 'next/link'

export default async function ModeratorDashboardPage() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/auth/login')
  }

  // Sync user and check if moderator
  const user: UserType = await syncUserWithDatabase(clerkUser)
  
  if (user.role !== 'moderator' && user.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Panou Moderator</h1>
          <p className="mt-2 text-muted-foreground">
            Scanați codurile QR ale participanților pentru a confirma prezența
          </p>
        </div>

        <div className="bg-card shadow border border-border rounded-lg p-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
              <FaQrcode className="w-12 h-12 text-primary" />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Scanare Cod QR
              </h2>
              <p className="text-muted-foreground">
                Folosiți camera telefonului pentru a scana codul QR al participantului
              </p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Participanții pot accesa codul lor QR de pe pagina de profil sau din email-ul de confirmare
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-sm text-foreground mb-2">Instrucțiuni:</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Cereți participantului să afișeze codul QR</li>
                  <li>Scanați codul folosind camera</li>
                  <li>Confirmați prezența la workshop-uri</li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard/moderator/scan"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
              >
                <FaQrcode className="mr-2 h-5 w-5" />
                Deschide Scanner QR
              </Link>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📱 Notă
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Accesul dvs. este limitat la confirmarea prezenței participanților. 
            Pentru alte funcții administrative, contactați un administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

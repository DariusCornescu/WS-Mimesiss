import { requireRoleOrRedirect } from '@/lib/auth'
import { FaInfoCircle, FaQrcode } from 'react-icons/fa'
import Link from 'next/link'

export default async function ModeratorDashboardPage() {
  await requireRoleOrRedirect('admin', 'moderator')

  return (
    <div className="mx-auto max-w-2xl py-2 sm:py-4">
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Panou Moderator</h1>
          <p className="mt-2 text-muted-foreground">
            Scanați codurile QR ale participanților pentru a confirma prezența
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow sm:p-8">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10">
              <FaQrcode className="w-12 h-12 text-accent" />
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
                className="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-accent/50 bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto"
              >
                <FaQrcode className="mr-2 h-5 w-5" aria-hidden="true" />
                Deschide Scanner QR
              </Link>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-accent/10 border border-accent/30 rounded-lg p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent">
            <FaInfoCircle aria-hidden="true" /> Notă
          </h3>
          <p className="text-sm text-foreground">
            Accesul dvs. este limitat la confirmarea prezenței participanților. 
            Pentru alte funcții administrative, contactați un administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

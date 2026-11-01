import { requireRoleOrRedirect } from '@/lib/auth'
import QRScanner from '@/components/QRScanner'

export default async function ScannerPage() {
  await requireRoleOrRedirect('admin', 'moderator')

  return (
    <div className="mx-auto max-w-2xl py-2 sm:py-4">
      <div>
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

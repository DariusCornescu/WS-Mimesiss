import { Suspense } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Link from 'next/link';
import { getAppSettings } from '@/lib/settings';

async function SuccessContent() {
  const settings = await getAppSettings();
  const isBall = settings?.eventMode === 'ball';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <FaCheckCircle className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Plată finalizată cu succes!
          </h1>
          <p className="text-muted-foreground">
            {isBall
              ? 'Mulțumim pentru achiziționarea biletului la Balul MIMESISS 2026.'
              : 'Mulțumim pentru achiziționarea biletului pentru MIMESISS 2025.'}
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-foreground">
            {isBall
              ? ' Biletul dvs. este disponibil în secțiunea Biletele mele.'
              : 'Veți primi în curând un email de confirmare cu detaliile biletului. Nivelul dvs. de acces a fost actualizat automat.'}
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-primary text-primary-foreground py-3 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Mergi la Dashboard
          </Link>
          
          {isBall ? (
            <Link
              href="/dashboard/tickets"
              className="block w-full border border-border bg-background text-foreground py-3 px-4 rounded-md font-medium hover:bg-muted transition-colors"
            >
              Vezi biletele mele
            </Link>
          ) : (
            <Link
              href="/workshops"
              className="block w-full border border-border bg-background text-foreground py-3 px-4 rounded-md font-medium hover:bg-muted transition-colors"
            >
              Vezi Workshop-urile
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
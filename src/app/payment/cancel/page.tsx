import { FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <FaTimesCircle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Plată anulată
          </h1>
          <p className="text-muted-foreground">
            Procesul de plată a fost anulat. Nu s-a perceput nicio taxă.
          </p>
        </div>

        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-sm text-foreground">
            Puteți încerca din nou oricând să achiziționați un bilet pentru MIMESISS 2025.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/payment"
            className="block w-full bg-primary text-primary-foreground py-3 px-4 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Încearcă din nou
          </Link>
          
          <Link
            href="/dashboard"
            className="block w-full border border-border bg-background text-foreground py-3 px-4 rounded-md font-medium hover:bg-muted transition-colors"
          >
            Înapoi la Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
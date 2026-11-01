import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncUserWithDatabase } from '@/lib/auth';
import { User } from '@/types/models';
import EnhancedTicketSelector from '@/components/payments/EnhancedTicketSelector';
import BallTicketSelector from '@/components/payments/BallTicketSelector';
import { getAppSettings } from '@/lib/settings';
import connectDB from '@/lib/mongodb';
import { Payment } from '@/models';
import PaymentShell from '@/components/payments/PaymentShell';

export default async function PaymentPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect('/auth/login');
  }

  const user: User = await syncUserWithDatabase(clerkUser);
  const appSettings = await getAppSettings();
  const paymentsEnabled = appSettings?.paymentsEnabled ?? true;
  const eventMode = appSettings?.eventMode || 'workshops';

  // For ball mode: calculate how many ball tickets this user already owns
  let alreadyPurchasedBallTickets = 0;
  if (eventMode === 'ball') {
    await connectDB();
    const ballPayments = await Payment.find({
      clerkId: user.clerkId,
      ticketCategory: 'ball',
      status: 'completed',
    }).lean();
    alreadyPurchasedBallTickets = ballPayments.reduce(
      (sum: number, p: { quantity?: number }) => sum + (p.quantity || 1),
      0
    );
  }

  return (
    <PaymentShell
      title="Finalizează participarea"
      description="Alege biletul potrivit evenimentului și finalizează plata în câțiva pași simpli."
    >
      {!paymentsEnabled ? (
        <div role="status" className="rounded-lg border border-accent/30 bg-accent/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Plăți indisponibile
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">Vânzarea biletelor este momentan închisă</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Revino mai târziu pentru a verifica disponibilitatea biletelor.
          </p>
        </div>
      ) : eventMode === 'ball' ? (
        <BallTicketSelector
          ballMaxTicketsPerUser={appSettings.ballMaxTicketsPerUser ?? 2}
          ballTicketAvailableFrom={
            appSettings.ballTicketAvailableFrom
              ? new Date(appSettings.ballTicketAvailableFrom).toISOString()
              : null
          }
          ballTicketAvailableTo={
            appSettings.ballTicketAvailableTo
              ? new Date(appSettings.ballTicketAvailableTo).toISOString()
              : null
          }
          alreadyPurchased={alreadyPurchasedBallTickets}
        />
      ) : (
        <EnhancedTicketSelector />
      )}
    </PaymentShell>
  );
}

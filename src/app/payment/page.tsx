import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncUserWithDatabase } from '@/lib/auth';
import { User } from '@/types/models';
import EnhancedTicketSelector from '@/components/payments/EnhancedTicketSelector';
import BallTicketSelector from '@/components/payments/BallTicketSelector';
import { getAppSettings } from '@/lib/settings';
import connectDB from '@/lib/mongodb';
import { Payment } from '@/models';

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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {!paymentsEnabled ? (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg">
            <strong>Notă:</strong> Plățile sunt momentan închise. Te rugăm să verifici înapoi mai târziu.
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
      </div>
    </div>
  );
}

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncUserWithDatabase } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { IssuedTicket, Payment, Ticket } from '@/models';
import { FaTicketAlt, FaCheck, FaTimes, FaCalendar, FaShoppingCart } from 'react-icons/fa';
import type { User as UserType } from '@/types/models';
import Link from 'next/link';
import { getAppSettings } from '@/lib/settings';
import TicketQRPopover from '@/components/TicketQRPopover';

export default async function MyTicketsPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) redirect('/auth/login');

  const user: UserType = await syncUserWithDatabase(clerkUser);
  await connectDB();

  const appSettings = await getAppSettings();
  const isBallMode = appSettings?.eventMode === 'ball';
  const ballMax = appSettings?.ballMaxTicketsPerUser ?? 2;

  // --- Ball tickets: fetched from IssuedTicket (one doc per physical ticket) ---
  const issuedTickets = await IssuedTicket.find({ clerkId: user.clerkId })
    .sort({ ticketNumber: 1 })
    .lean();

  // --- Workshop tickets: still fetched from Payment (single purchase = single ticket) ---
  const workshopPayments = await Payment.find({
    clerkId: user.clerkId,
    status: 'completed',
    $or: [{ ticketCategory: 'workshop' }, { ticketCategory: { $exists: false } }],
  }).sort({ createdAt: -1 }).lean();

  // Enrich workshop payments with ticket product data
  const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);
  const ticketIds = [...new Set(workshopPayments.map((p) => p.ticketId).filter((id): id is string => !!id && isValidObjectId(id)))];
  const ticketProducts = await Ticket.find({ _id: { $in: ticketIds } }).lean();
  const ticketMap = new Map(ticketProducts.map((t) => [(t._id as { toString(): string }).toString(), t]));

  const ballCount = issuedTickets.filter((t) => t.category === 'ball').length;
  const workshopOwned = workshopPayments.length > 0;

  const ticketsRemaining = isBallMode
    ? Math.max(0, ballMax - ballCount)
    : workshopOwned ? 0 : 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Biletele mele</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Toate biletele achiziționate pentru MIMESISS 2025
        </p>
      </div>

      {/* Buy more / buy first banner */}
      {ticketsRemaining > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-5 py-4">
          <div>
            <p className="font-medium text-foreground">
              {isBallMode
                ? ballCount === 0
                  ? 'Nu ai bilete de bal încă'
                  : `Mai poți cumpăra ${ticketsRemaining} bilet${ticketsRemaining > 1 ? 'e' : ''} de bal`
                : 'Nu ai niciun bilet de eveniment'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isBallMode
                ? `Limita ta este de ${ballMax} bilet${ballMax > 1 ? 'e' : ''}`
                : 'Achiziționează un bilet pentru a participa'}
            </p>
          </div>
          <Link
            href="/payment"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <FaShoppingCart className="h-3 w-3" />
            Cumpără bilet
          </Link>
        </div>
      )}

      {issuedTickets.length === 0 && workshopPayments.length === 0 && (
        <div className="text-center py-16 mimesiss-section-card">
          <FaTicketAlt className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground">Nu ai bilete achiziționate</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            Cumpără un bilet pentru a participa la MIMESISS 2025
          </p>
          <a href="/payment" className="mimesiss-button-primary inline-flex items-center gap-2">
            <FaTicketAlt className="h-4 w-4" />
            Cumpără bilet
          </a>
        </div>
      )}

      {/* Ball tickets — one card per IssuedTicket document */}
      {ballCount > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Bilete Bal</h2>
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
              {ballCount} bilet{ballCount !== 1 ? 'e' : ''}
            </span>
          </div>
          <div className="grid gap-4">
            {issuedTickets.filter((t) => t.category === 'ball').map((ticket) => (
              <div key={(ticket._id as { toString(): string }).toString()} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Serial strip */}
                <div className="bg-primary/10 border-b border-border px-5 py-2 flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-primary tracking-widest">
                    Bilet #{String(ticket.ticketNumber).padStart(4, '0')}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${ticket.status === 'used'
                    ? 'bg-muted text-muted-foreground border-border'
                    : ticket.status === 'cancelled'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                    <FaCheck className="h-2.5 w-2.5" />
                    {ticket.status === 'used' ? 'Folosit' : ticket.status === 'cancelled' ? 'Anulat' : 'Activ'}
                  </span>
                </div>
                <div className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg"><FaTicketAlt /></span>
                  </div>
                  <div className="flex-1 min-w-0 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-foreground">{ticket.ticketTitle}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {(ticket.pricePerTicket / 100).toFixed(2)} {ticket.currency}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <FaCalendar className="h-3 w-3" />
                        Achiziționat {new Date(ticket.createdAt).toLocaleDateString('ro-RO', {
                          day: 'numeric', month: 'long', year: 'numeric',
                        })}
                      </p>
                      
                    </div>
                      <TicketQRPopover
                        ticketId={(ticket._id as { toString(): string }).toString()}
                        ticketLabel={`${ticket.ticketTitle} #${String(ticket.ticketNumber).padStart(4, '0')}`}
                      />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Workshop tickets */}
      {workshopPayments.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Bilete Workshop</h2>
          <div className="grid gap-4">
            {workshopPayments.map((payment) => {
              const ticketProduct = ticketMap.get(payment.ticketId || '');
              return (
                <div key={(payment._id as { toString(): string }).toString()} className="bg-card border border-border rounded-lg p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FaTicketAlt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 flex">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {ticketProduct?.title || payment.ticketType}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border ${payment.status === 'completed'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                        {payment.status === 'completed'
                          ? <><FaCheck className="h-2.5 w-2.5" /> Plătit</>
                          : <><FaTimes className="h-2.5 w-2.5" /> {payment.status}</>}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(payment.amount / 100).toFixed(2)} {payment.currency}
                    </p>
                    {ticketProduct?.features && (
                      <ul className="mt-2 space-y-1">
                        {ticketProduct.features.slice(0, 3).map((f) => (
                          <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <FaCheck className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <FaCalendar className="h-3 w-3" />
                      Achiziționat {new Date(payment.createdAt).toLocaleDateString('ro-RO', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <div className="mt-3">
                      <TicketQRPopover
                        ticketId={(payment._id as { toString(): string }).toString()}
                        ticketLabel={ticketProduct?.title || payment.ticketType || 'Bilet'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

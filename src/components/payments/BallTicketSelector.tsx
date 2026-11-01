'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCheck, FaMinus, FaPlus, FaTicketAlt, FaClock } from 'react-icons/fa';
import { getPublicTickets } from '@/app/payment/actions';
import type { Ticket as TicketType } from '@/types/models';
import EmbeddedCheckout from './EmbeddedCheckout';

interface BallTicketSelectorProps {
  ballMaxTicketsPerUser: number;
  ballTicketAvailableFrom?: string | null;
  ballTicketAvailableTo?: string | null;
  /** How many ball tickets the user has already bought */
  alreadyPurchased?: number;
}

export default function BallTicketSelector({
  ballMaxTicketsPerUser,
  ballTicketAvailableFrom,
  ballTicketAvailableTo,
  alreadyPurchased = 0,
}: BallTicketSelectorProps) {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [tickets, setTickets] = useState<TicketType[]>([]);

  const remaining = ballMaxTicketsPerUser - alreadyPurchased;

  // Check availability window
  const now = new Date();
  const availableFrom = ballTicketAvailableFrom ? new Date(ballTicketAvailableFrom) : null;
  const availableTo = ballTicketAvailableTo ? new Date(ballTicketAvailableTo) : null;

  const notYetOpen = availableFrom && now < availableFrom;
  const closed = availableTo && now > availableTo;
  const isOpen = !notYetOpen && !closed;

  useEffect(() => {
    getPublicTickets().then((all) => {
      setTickets(all.filter((t) => t.category === 'ball' && t.enabled));
    });
  }, []);

  const handleSelectTicket = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    router.push(`/payment/success?payment_intent=${encodeURIComponent(paymentIntentId)}`);
  };

  const clampQuantity = (val: number) =>
    Math.max(1, Math.min(val, remaining));

  if (showCheckout && selectedTicket) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <button
          type="button"
          onClick={() => setShowCheckout(false)}
          className="flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <FaArrowLeft className="h-3 w-3" aria-hidden="true" />
          Înapoi la selecția biletelor
        </button>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pasul 2 · Date de plată</p>
          <h2 className="mt-2 text-2xl font-bold text-foreground">Finalizează plata</h2>
          <div className="mt-5 rounded-lg border border-border bg-muted/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{selectedTicket.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {quantity} × {selectedTicket.price} RON
                </p>
              </div>
              <strong className="text-xl text-accent">{(quantity * selectedTicket.price).toFixed(2)} RON</strong>
            </div>
          </div>
        </div>

        <EmbeddedCheckout
          ticketId={selectedTicket._id || selectedTicket.id || ''}
          quantity={quantity}
          onSuccess={handlePaymentSuccess}
          onError={(e) => console.error('Payment error:', e)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
          <FaTicketAlt className="h-4 w-4" aria-hidden="true" />
          Bilete pentru bal
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pasul 1 · Selectare</p>
        <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">Alege biletele pentru bal</h2>
        <p className="mt-2 leading-relaxed text-muted-foreground">
          Poți achiziționa până la <strong className="text-foreground">{ballMaxTicketsPerUser}</strong> bilete per persoană.
        </p>
      </div>

      {/* Availability notice */}
      {notYetOpen && availableFrom && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-foreground">
          <FaClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="font-medium">Biletele nu sunt disponibile încă</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Se deschid pe {availableFrom.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {closed && availableTo && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-foreground">
          <FaClock className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">Vânzarea biletelor s-a încheiat</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Termenul limită a fost {availableTo.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Already purchased summary */}
      {alreadyPurchased > 0 && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-foreground">
          <FaCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" aria-hidden="true" />
          <div>
            <p className="font-medium">Ai deja {alreadyPurchased} bilet{alreadyPurchased !== 1 ? 'e' : ''} cumpărat{alreadyPurchased !== 1 ? 'e' : ''}</p>
            {remaining > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">Mai poți cumpăra {remaining} bilet{remaining !== 1 ? 'e' : ''}</p>
            )}
          </div>
        </div>
      )}

      {remaining <= 0 && (
        <div role="status" className="rounded-lg border border-secondary/30 bg-secondary/10 p-8 text-center">
          <FaCheck className="mx-auto mb-3 h-12 w-12 text-secondary" aria-hidden="true" />
          <h3 className="text-lg font-medium text-foreground">Ai atins limita maximă de bilete</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Ai cumpărat {alreadyPurchased} / {ballMaxTicketsPerUser} bilete disponibile.
          </p>
        </div>
      )}

      {/* Ticket cards */}
      {remaining > 0 && isOpen && tickets.length > 0 && (
        <div className="mx-auto grid max-w-2xl gap-5">
          {tickets.map((ticket) => (
            <article
              key={ticket._id || ticket.id}
              className="relative rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/50"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-1">{ticket.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{ticket.description}</p>
                <div className="text-3xl font-bold text-accent">{ticket.price} RON</div>
                <p className="text-xs text-muted-foreground mt-1">per bilet</p>
              </div>

              <ul className="space-y-2 mb-6">
                {ticket.features.map((f) => (
                  <li key={f} className="flex items-center text-sm text-muted-foreground">
                    <FaCheck className="mr-2 h-3 w-3 flex-shrink-0 text-accent" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Quantity selector */}
              <div className="mb-5 flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:gap-4">
                <span className="text-sm text-muted-foreground">Cantitate:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Scade cantitatea"
                    onClick={() => setQuantity((q) => clampQuantity(q - 1))}
                    disabled={quantity <= 1}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <FaMinus className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center font-bold text-foreground" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Crește cantitatea"
                    onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                    disabled={quantity >= remaining}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <FaPlus className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground sm:ml-auto">
                  Total: <strong className="text-foreground">{(ticket.price * quantity).toFixed(2)} RON</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTicket(ticket)}
                className="min-h-12 w-full rounded-lg border border-accent/50 bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Cumpără {quantity} bilet{quantity !== 1 ? 'e' : ''}
              </button>
            </article>
          ))}
        </div>
      )}

      {remaining > 0 && isOpen && tickets.length === 0 && (
        <div role="status" className="rounded-lg border border-border bg-muted/40 py-12 text-center text-muted-foreground">
          Nu există bilete de bal disponibile momentan.
        </div>
      )}
    </div>
  );
}

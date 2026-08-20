'use client';

import { useEffect, useState } from 'react';
import { FaArrowLeft, FaCheck, FaMinus, FaPlus, FaTicketAlt, FaClock } from 'react-icons/fa';
import { getAllTickets } from '@/app/admin/tickets/actions';
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
    getAllTickets().then((all) => {
      setTickets(all.filter((t) => t.category === 'ball' && t.enabled));
    });
  }, []);

  const handleSelectTicket = (ticket: TicketType) => {
    setSelectedTicket(ticket);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
    window.location.href = '/payment/success';
  };

  const clampQuantity = (val: number) =>
    Math.max(1, Math.min(val, remaining));

  if (showCheckout && selectedTicket) {
    return (
      <div className="space-y-6 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setShowCheckout(false)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <FaArrowLeft className="h-3 w-3" />
          Înapoi
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {selectedTicket.title}
          </h2>
          <p className="text-muted-foreground mb-1">
            {quantity} × {selectedTicket.price} RON ={' '}
            <strong className="text-primary">{(quantity * selectedTicket.price).toFixed(2)} RON</strong>
          </p>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <FaTicketAlt className="h-4 w-4" />
          Bilete Bal MIMESISS 2025
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Alege biletele pentru bal</h2>
        <p className="text-muted-foreground">
          Poți achiziționa până la <strong className="text-foreground">{ballMaxTicketsPerUser}</strong> bilete per persoană.
        </p>
      </div>

      {/* Availability notice */}
      {notYetOpen && availableFrom && (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-3">
          <FaClock className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Biletele nu sunt disponibile încă</p>
            <p className="text-sm opacity-80">
              Se deschid pe {availableFrom.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {closed && availableTo && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3">
          <FaClock className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Vânzarea biletelor s-a încheiat</p>
            <p className="text-sm opacity-80">
              Termenul limită a fost {availableTo.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Already purchased summary */}
      {alreadyPurchased > 0 && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-4 py-3">
          <FaCheck className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Ai deja {alreadyPurchased} bilet{alreadyPurchased !== 1 ? 'e' : ''} cumpărat{alreadyPurchased !== 1 ? 'e' : ''}</p>
            {remaining > 0 && (
              <p className="text-sm opacity-80">Mai poți cumpăra {remaining} bilet{remaining !== 1 ? 'e' : ''}</p>
            )}
          </div>
        </div>
      )}

      {remaining <= 0 && (
        <div className="text-center py-8 mimesiss-section-card">
          <FaCheck className="mx-auto h-12 w-12 text-green-500 mb-3" />
          <h3 className="text-lg font-medium text-foreground">Ai atins limita maximă de bilete</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Ai cumpărat {alreadyPurchased} / {ballMaxTicketsPerUser} bilete disponibile.
          </p>
        </div>
      )}

      {/* Ticket cards */}
      {remaining > 0 && isOpen && tickets.length > 0 && (
        <div className="grid gap-6 max-w-2xl mx-auto">
          {tickets.map((ticket) => (
            <div
              key={ticket._id || ticket.id}
              className="relative rounded-lg border border-border bg-card p-6 hover:border-primary/50 transition-all"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-1">{ticket.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{ticket.description}</p>
                <div className="text-3xl font-bold text-primary">{ticket.price} RON</div>
                <p className="text-xs text-muted-foreground mt-1">per bilet</p>
              </div>

              <ul className="space-y-2 mb-6">
                {ticket.features.map((f) => (
                  <li key={f} className="flex items-center text-sm">
                    <FaCheck className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Quantity selector */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-muted-foreground">Cantitate:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => clampQuantity(q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
                  >
                    <FaMinus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => clampQuantity(q + 1))}
                    disabled={quantity >= remaining}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
                  >
                    <FaPlus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground ml-auto">
                  Total: <strong className="text-foreground">{(ticket.price * quantity).toFixed(2)} RON</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectTicket(ticket)}
                className="w-full py-3 px-4 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Cumpără {quantity} bilet{quantity !== 1 ? 'e' : ''}
              </button>
            </div>
          ))}
        </div>
      )}

      {remaining > 0 && isOpen && tickets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Nu există bilete de bal disponibile momentan.
        </div>
      )}
    </div>
  );
}

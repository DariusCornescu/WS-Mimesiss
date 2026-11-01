'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import { getPublicTickets } from '@/app/payment/actions';
import type { Ticket as TicketType } from '@/types/models';
import EmbeddedCheckout from './EmbeddedCheckout';

export default function EnhancedTicketSelector() {
	const router = useRouter();
	const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
	const [showCheckout, setShowCheckout] = useState(false);
	const [tickets, setTickets] = useState<TicketType[]>([]);

	
	// Fetch tickets on component mount
	useEffect(() => {
		const fetchTickets = async () => {
			const allTickets = await getPublicTickets();
			// Filter only enabled tickets
			const enabledTickets = allTickets.filter(ticket => ticket.enabled !== false);
			setTickets(enabledTickets);
		};

		fetchTickets();
	}, []);

	const handleSelectTicket = (ticket: TicketType) => {
		setSelectedTicket(ticket);
		setShowCheckout(true);
	}


	const handlePaymentSuccess = (paymentIntentId: string) => {
		router.push(`/payment/success?payment_intent=${encodeURIComponent(paymentIntentId)}`);
	};

	const handlePaymentError = (error: string) => {
		console.error('Payment error:', error);
		// Keep checkout open for retry
	};

	if (showCheckout && selectedTicket) {
		return (
			<div className="mx-auto max-w-lg space-y-6">
				<div>
					<button
						type="button"
						onClick={() => setShowCheckout(false)}
						className="mb-6 flex items-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					>
						<FaArrowLeft className="h-3 w-3" aria-hidden="true" />
						Înapoi la selecția biletelor
					</button>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pasul 2 · Date de plată</p>
					<h2 className="mt-2 text-2xl font-bold text-foreground">
						Finalizează plata
					</h2>

					<div className="mt-5 rounded-lg border border-border bg-muted/50 p-5">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="font-semibold text-foreground">{selectedTicket.title}</p>
								<p className="mt-1 text-sm text-muted-foreground">Bilet selectat</p>
							</div>
							<strong className="text-xl text-accent">{selectedTicket.price} RON</strong>
						</div>
						<ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
						{selectedTicket.features.map((feature) => (
							<li key={feature} className="flex items-center text-sm text-muted-foreground">
								<FaCheck className="mr-3 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
								<span>{feature}</span>
							</li>
						))}
						</ul>
					</div>
				</div>

				<EmbeddedCheckout
					ticketId={selectedTicket._id || selectedTicket.id || ''}
					onSuccess={handlePaymentSuccess}
					onError={handlePaymentError}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-7">
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pasul 1 · Selectare</p>
				<h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
					Alege tipul de bilet
				</h2>
				<p className="mt-2 leading-relaxed text-muted-foreground">
					Selectează nivelul de participare potrivit evenimentului.
				</p>
			</div>

			<div className="grid gap-5 xl:grid-cols-2">
				{tickets.map((ticket) => {
					const purchased = ticket._id === selectedTicket?._id;

					return (
						<article
							key={ticket._id}
							className={`relative flex h-full flex-col rounded-lg border p-6 transition-colors ${purchased
								? 'border-primary bg-primary/5'
								: 'border-border bg-card hover:border-accent/50'
								}`}
						>
							{purchased && (
								<div className="absolute -right-3 -top-3 rounded-full border border-accent/40 bg-primary p-2 text-primary-foreground" aria-label="Bilet selectat">
									<FaCheck className="h-4 w-4" aria-hidden="true" />
								</div>
							)}

							<div className="mb-4">
								<h3 className="text-xl font-bold text-foreground mb-2">
									{ticket.title}
								</h3>
								<p className="text-muted-foreground text-sm mb-4">
									{ticket.description}
								</p>
								<div className="text-3xl font-bold text-accent">
									{ticket.price} RON
								</div>
							</div>

							<ul className="mb-6 space-y-2">
								{ticket.features.map((feature) => (
									<li key={feature} className="flex items-center text-sm text-muted-foreground">
										<FaCheck className="mr-3 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<button
								type="button"
								onClick={() => handleSelectTicket(ticket)}
								disabled={purchased}
								className={`mt-auto min-h-12 w-full rounded-lg border px-4 py-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${purchased
									? 'cursor-not-allowed border-primary/30 bg-primary/20 text-accent'
									: 'border-accent/50 bg-primary text-primary-foreground hover:bg-primary/90'
									}`}
							>
								{purchased ? 'Deja cumpărat' : 'Cumpără acum'}
							</button>
						</article>
					);
				})}
			</div>

			<div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground" role="status">
				<p>
					Plățile sunt procesate securizat prin Stripe. Vei primi confirmarea după finalizarea plății.
				</p>
			</div>
		</div>
	);

}

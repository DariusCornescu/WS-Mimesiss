'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import { getPublicTickets } from '@/app/payment/actions';
import type { Ticket as TicketType } from '@/types/models';
import EmbeddedCheckout from './EmbeddedCheckout';
import { isAddOnProduct as isAddOn, isBundleProduct } from '@/lib/ticket-products';
import { describeBucharestClock } from '@/lib/bucharest-time';

export default function EnhancedTicketSelector() {
	const router = useRouter();
	const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
	const [selectedAddOn, setSelectedAddOn] = useState<TicketType | null>(null);
	const [addOnChosen, setAddOnChosen] = useState(false);
	const [showCheckout, setShowCheckout] = useState(false);
	const [tickets, setTickets] = useState<TicketType[]>([]);


	// Fetch tickets on component mount
	useEffect(() => {
		const fetchTickets = async () => {
			const allTickets = await getPublicTickets();
			// Filter only enabled tickets; add-ons follow the tickets they extend
			const enabledTickets = allTickets.filter(ticket => ticket.enabled !== false);
			setTickets([...enabledTickets.filter(ticket => !isAddOn(ticket)), ...enabledTickets.filter(isAddOn)]);
		};

		fetchTickets();
	}, []);

	// Someone without a workshop ticket gets the add-on as an option on that
	// ticket, paid together with it, instead of as a card of its own.
	const addOnOffer = tickets.find(ticket => isAddOn(ticket) && !ticket.soldOut && ticket.requiresBaseTicket) ?? null;
	const visibleTickets = tickets.filter(ticket => !(isAddOn(ticket) && ticket.requiresBaseTicket));

	const handleSelectTicket = (ticket: TicketType) => {
		setSelectedTicket(ticket);
		setSelectedAddOn(addOnChosen && ticket.workshopAccess && !isBundleProduct(ticket) && addOnOffer ? addOnOffer : null);
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
						onClick={() => {
							// Going back means choosing again: nothing was bought, so no
							// card may stay marked as selected or disabled.
							setShowCheckout(false);
							setSelectedTicket(null);
							setSelectedAddOn(null);
						}}
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
						{selectedAddOn && (
							<>
								<div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-border/60 pt-4">
									<div>
										<p className="font-semibold text-foreground">{selectedAddOn.title}</p>
										<p className="mt-1 text-sm text-muted-foreground">Un workshop în plus</p>
									</div>
									<strong className="text-xl text-accent">+{selectedAddOn.price} RON</strong>
								</div>
								<div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
									<p className="font-semibold text-foreground">Total</p>
									<strong className="text-xl text-accent">{selectedTicket.price + selectedAddOn.price} RON</strong>
								</div>
							</>
						)}
						{selectedTicket.workshopAccess && (
							<p className="mt-4 border-t border-border/60 pt-4 text-sm leading-relaxed text-muted-foreground">
								Workshopurile le alegi ulterior, din contul tău. Te anunțăm când se deschide alegerea.
							</p>
						)}
					</div>
				</div>

				<EmbeddedCheckout
					ticketId={selectedTicket._id || selectedTicket.id || ''}
					addOnTicketId={selectedAddOn ? selectedAddOn._id || selectedAddOn.id : undefined}
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

			{/* One ticket per row: the column is already half the page wide. */}
			<div className="grid gap-5">
				{visibleTickets.map((ticket) => {
					const purchased = ticket._id === selectedTicket?._id;
					const addOn = isAddOn(ticket);
					const unavailable = ticket.soldOut || ticket.requiresBaseTicket;
					const offersAddOn = Boolean(ticket.workshopAccess && !isBundleProduct(ticket) && addOnOffer && !ticket.soldOut);
					const total = ticket.price + (offersAddOn && addOnChosen && addOnOffer ? addOnOffer.price : 0);

					return (
						<article
							key={ticket._id}
							className={`relative flex h-full flex-col rounded-lg border p-6 transition-colors sm:p-8 ${purchased
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
								{ticket.offerEndsAt && (
									<p className="mb-2 inline-flex rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
										Ofertă limitată · până la {describeBucharestClock(ticket.offerEndsAt)}
									</p>
								)}
								{addOn && (
									<p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
										Supliment
									</p>
								)}
								<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
									<h3 className="text-2xl font-bold text-foreground">
										{ticket.title}
									</h3>
									<div className="text-4xl font-bold text-accent">
										{ticket.price} RON
									</div>
								</div>
								<p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
									{ticket.description}
								</p>
							</div>

							<ul className="mb-6 space-y-2">
								{ticket.features.map((feature) => (
									<li key={feature} className="flex items-center text-muted-foreground">
										<FaCheck className="mr-3 h-4 w-4 flex-shrink-0 text-accent" aria-hidden="true" />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							{offersAddOn && addOnOffer && (
								<label className="mb-4 flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3">
									<input
										type="checkbox"
										checked={addOnChosen}
										onChange={(event) => setAddOnChosen(event.target.checked)}
										className="mt-0.5 h-4 w-4 flex-none rounded border-input bg-background accent-primary"
									/>
									<span className="text-sm leading-relaxed">
										<span className="block font-semibold text-foreground">
											Adaugă un workshop în plus (+{addOnOffer.price} RON)
										</span>
										<span className="block text-muted-foreground">
											Plătești o singură dată. Workshopurile le alegi ulterior, din contul tău.
										</span>
									</span>
								</label>
							)}

							<button
								type="button"
								onClick={() => handleSelectTicket(ticket)}
								disabled={purchased || unavailable}
								className={`mt-auto min-h-12 w-full rounded-lg border px-4 py-3 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${unavailable
									? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
									: purchased
									? 'cursor-not-allowed border-primary/30 bg-primary/20 text-accent'
									: 'border-accent/50 bg-primary text-primary-foreground hover:bg-primary/90'
									}`}
							>
								{ticket.soldOut ? 'Epuizat' : ticket.requiresBaseTicket ? 'Necesită biletul de bază' : purchased ? 'Deja cumpărat' : offersAddOn && addOnChosen ? `Cumpără acum · ${total} RON` : 'Cumpără acum'}
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

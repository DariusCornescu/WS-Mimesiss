'use client';

import { useEffect, useState } from 'react';
import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import { getAllTickets } from '@/app/admin/tickets/actions';
import type { Ticket as TicketType } from '@/types/models';
import EmbeddedCheckout from './EmbeddedCheckout';

interface EnhancedTicketSelectorProps {
}

export default function EnhancedTicketSelector() {
	const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
	const [showCheckout, setShowCheckout] = useState(false);
	const [tickets, setTickets] = useState<TicketType[]>([]);

	
	// Fetch tickets on component mount
	useEffect(() => {
		const fetchTickets = async () => {
			const allTickets = await getAllTickets();
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


	const handlePaymentSuccess = () => {
		// Redirect to success page instead of reloading
		window.location.href = '/payment/success';
	};

	const handlePaymentError = (error: string) => {
		console.error('Payment error:', error);
		// Keep checkout open for retry
	};

	if (showCheckout && selectedTicket) {
		return (
			<div className="space-y-6 max-w-md mx-auto">
				<div className="text-center">
					<button
						type="button"
						onClick={() => setShowCheckout(false)}
						className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mx-auto"
					>
						<FaArrowLeft className="h-3 w-3" />
						Înapoi la selecția biletelor
					</button>
					<h2 className="text-2xl font-bold text-foreground mb-2">
						Finalizare plată - {selectedTicket.title}
					</h2>
					<p className="text-muted-foreground mb-4">
						{selectedTicket.price} RON
					</p>
					<ul className='mx-auto space-y-2 mb-6'>
						{selectedTicket.features.map((feature) => (
							<li key={feature} className='flex items-center text-sm'>
								<FaCheck className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
								<span>{feature}</span>
							</li>
						))}
					</ul>
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
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-3xl font-bold text-foreground mb-2">
					Alegeți tipul de bilet
				</h2>
				<p className="text-muted-foreground">
					Selectați nivelul de participare la MIMESISS 2025
				</p>
			</div>

			<div className="ticket-grid">
				{tickets.map((ticket) => {
					const purchased = ticket._id === selectedTicket?._id;

					return (
						<div
							key={ticket._id}
							className={`relative rounded-lg border p-6 transition-all ${purchased
								? 'border-primary bg-primary/5'
								: 'border-border bg-card hover:border-primary/50'
								}`}
						>
							{purchased && (
								<div className="absolute -top-3 -right-3 bg-primary text-primary-foreground rounded-full p-2">
									<FaCheck className="h-4 w-4" />
								</div>
							)}

							<div className="mb-4">
								<h3 className="text-xl font-bold text-foreground mb-2">
									{ticket.title}
								</h3>
								<p className="text-muted-foreground text-sm mb-4">
									{ticket.description}
								</p>
								<div className="text-3xl font-bold text-primary">
									{ticket.price} RON
								</div>
							</div>

							<ul className="space-y-2 mb-6">
								{ticket.features.map((feature) => (
									<li key={feature} className="flex items-center text-sm">
										<FaCheck className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
										<span>{feature}</span>
									</li>
								))}
							</ul>

							<button
								type="button"
								onClick={() => handleSelectTicket(ticket)}
								disabled={purchased}
								className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${purchased
									? 'bg-primary/20 text-primary cursor-not-allowed'
									: 'bg-primary text-primary-foreground hover:bg-primary/90'
									}`}
							>
								{purchased ? 'Deja cumpărat' : 'Cumpără acum'}
							</button>
						</div>
					);
				})}
			</div>

			<div className="text-center text-sm text-muted-foreground">
				<p>
					Plățile sunt procesate securizat prin Stripe. <br />
					Veți primi o confirmare pe email după finalizarea plății.
				</p>
			</div>
		</div>
	);

}
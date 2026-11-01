'use client';
import type { Ticket } from '@/types/models';
import type { User } from '@/types/models';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import PageIntro from '@/components/ui/PageIntro';

export default function PaymentForm({users, tickets}: {users: User[], tickets: Ticket[]}) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsSubmitting(true);

		try {
			const form = e.target as HTMLFormElement;
			const formData = new FormData(form);
			const userId = formData.get('user')?.toString();
			const ticketId = formData.get('ticket')?.toString();
			const amount = formData.get('amount')?.toString();

			if (!userId || !ticketId || !amount) {
				setError('Toate câmpurile sunt obligatorii');
				setIsSubmitting(false);
				return;
			}

			const paymentData = {
				clerkId: userId,
				ticketId: ticketId,
				ticketType: tickets.find(t => (t._id || t.id) === ticketId)?.type || 'unknown',

				amount: Number(amount) * 100, // Convert to cents
				currency: 'RON',
				stripeSessionId: `manual_${Date.now()}_${userId}`,
				stripePaymentIntentId: `manual_${Date.now()}_${userId}`,
				status: 'completed' as const,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Call server action via API route to avoid importing Mongoose on client
			const response = await fetch('/api/admin/payments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(paymentData),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				console.error('Failed response:', response.status, errorData);
				throw new Error(errorData.details || errorData.error || 'Failed to create payment');	
			}

			const newPayment = await response.json();
			console.log('New payment created:', newPayment);
			
			// Redirect to payments list
			router.push('/admin/payments');
			router.refresh();
		} catch (err) {
			console.error('Error creating payment:', err);
			const errorMessage = err instanceof Error ? err.message : 'A apărut o eroare la crearea plății';
			setError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="space-y-6">
			<PageIntro
				eyebrow="Administrare · Plăți"
				title="Înregistrează o plată"
				description="Adaugă manual o plată finalizată și asociaz-o unui participant și unui tip de bilet."
				actions={(
					<Link
						href="/admin/payments"
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<FaArrowLeft aria-hidden="true" className="h-4 w-4" />
						Înapoi la plăți
					</Link>
				)}
			/>

			<form onSubmit={handleSubmit} aria-busy={isSubmitting} className="mimesiss-section-card p-5 sm:p-7">
				<div className="mb-6 flex items-start gap-4 border-b border-border/70 pb-5">
					<div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/20 text-accent">
						<FaCreditCard aria-hidden="true" />
					</div>
					<div>
						<h2 className="text-xl font-semibold text-foreground">Detaliile plății</h2>
						<p className="mt-1 text-sm leading-6 text-muted-foreground">Înregistrarea va fi salvată direct cu statusul „Finalizată”.</p>
					</div>
				</div>

				{error && (
					<div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
						{error}
					</div>
				)}

				{users.length > 0 ? (
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div>
							<label htmlFor="user" className="mb-2 block text-sm font-semibold text-foreground">Participant</label>
							<select id="user" name="user" className="mimesiss-input min-h-12" required disabled={isSubmitting}>
								<option value="">Alege un participant</option>
								{users.map(user => (
									<option key={user.clerkId} value={user.clerkId}>{user.email}</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="ticket" className="mb-2 block text-sm font-semibold text-foreground">Tipul biletului</label>
							<select id="ticket" name="ticket" className="mimesiss-input min-h-12" required disabled={isSubmitting}>
								<option value="">Alege un bilet</option>
								{tickets.map(ticket => (
									<option key={ticket._id || ticket.id} value={ticket._id || ticket.id}>{ticket.title}</option>
								))}
							</select>
						</div>

						<div className="md:col-span-2 md:max-w-sm">
							<label htmlFor="amount" className="mb-2 block text-sm font-semibold text-foreground">Sumă (RON)</label>
							<input
								type="number"
								id="amount"
								name="amount"
								placeholder="0,00"
								className="mimesiss-input min-h-12"
								step="0.01"
								min="0"
								required
								disabled={isSubmitting}
							/>
							<p className="mt-2 text-xs leading-5 text-muted-foreground">Introdu valoarea în lei; sistemul o salvează în formatul necesar plăților.</p>
						</div>
					</div>
				) : (
					<div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
						Nu există participanți eligibili pentru o plată manuală.
					</div>
				)}

				<div className="mt-7 flex justify-end border-t border-border/70 pt-5">
					<button
						type="submit"
						disabled={isSubmitting || users.length === 0}
						className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-accent/45 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
					>
						{isSubmitting ? 'Se înregistrează…' : 'Înregistrează plata'}
					</button>
				</div>
			</form>
		</div>
	);
}

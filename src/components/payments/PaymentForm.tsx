'use client';
import type { Ticket } from '@/types/models';
import type { User } from '@/types/models';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
				ticketType: tickets.find(t => t._id === ticketId)?.type || 'unknown',

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
		<form onSubmit={handleSubmit}>
			<h1 className="text-2xl font-bold">Creează o plată nouă</h1>
			
			{error && (
				<div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md">
					{error}
				</div>
			)}

			<div className="grid grid-cols-2 gap-4">
				{users.length > 0 ? (
					<div className="mt-4">
						<label htmlFor="user" className="block text-sm font-medium text-foreground mb-2">
							Selectează utilizator
						</label>
						<select id="user" name="user" className="mimesiss-input" required>
							<option value="">Alege un utilizator</option>
							{users.map(user => (
								<option key={user.clerkId} value={user.clerkId}>
									{user.email}
								</option>
							))}
						</select>
					</div>
				) : (
					<p>Toți utilizatorii au deja un nivel de acces atribuit.</p>
				)}
				<div className="mt-4">
					<label htmlFor="ticket" className="block text-sm font-medium text-foreground mb-2">
						Selectează bilet
					</label>
					<select id="ticket" name="ticket" className="mimesiss-input" required>
						<option value="">Alege un bilet</option>
						{tickets.map(ticket => (
							<option key={ticket._id} value={ticket._id}>
								{ticket.title}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="mt-4">
				<label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
					Sumă Plată (RON)
				</label>
				<input 
					type="number" 
					id="amount"
					name="amount"
					placeholder="Sumă" 
					className="mimesiss-input"
					step="0.01"
					min="0"
					required
				/>
			</div>

			<button
				type="submit"
				disabled={isSubmitting || users.length === 0}
				className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSubmitting ? 'Se creează...' : 'Creează Plata'}
			</button>
		</form>
	);
}

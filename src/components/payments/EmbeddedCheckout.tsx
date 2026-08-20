'use client';

import {
	Elements,
	PaymentElement,
	useElements,
	useStripe
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

// Load Stripe outside of component render to avoid recreating
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface EmbeddedCheckoutProps {
	ticketId: string;
	quantity?: number;
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

function CheckoutForm({ onSuccess, onError }: { onSuccess?: () => void; onError?: (error: string) => void }) {
	const stripe = useStripe();
	const elements = useElements();
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!stripe || !elements || isLoading) {
			return;
		}

		setIsLoading(true);
		setMessage('');

		const { error, paymentIntent } = await stripe.confirmPayment({
			elements,
			redirect: 'if_required',
		});

		if (error) {
			if (error.type === "card_error" || error.type === "validation_error") {
				setMessage(error.message || 'A apărut o eroare la procesarea plății');
				onError?.(error.message || 'A apărut o eroare la procesarea plății');
			} else {
				setMessage('A apărut o eroare neașteptată');
				onError?.(error.message || 'A apărut o eroare neașteptată');
			}
		} else if (paymentIntent && paymentIntent.status === 'succeeded') {
			// Payment succeeded, handle success locally
			onSuccess?.();
		}

		setIsLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">

			<PaymentElement
				options={{
					layout: 'accordion',
					paymentMethodOrder: ['google_pay', 'apple_pay', 'card'],
					wallets: {
						applePay: 'auto',
						googlePay: 'auto'
					},
					defaultValues: {
						billingDetails: {
							email: '',
						}
					}
				}}
			/>


			{message && (
				<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
					{message}
				</div>
			)}

			<button
				type="submit"
				disabled={isLoading || !stripe || !elements}
				className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{isLoading && <FaSpinner className="h-4 w-4 animate-spin" />}
				{isLoading ? 'Se procesează...' : 'Finalizează plata'}
			</button>
		</form>
	);
}

export default function EmbeddedCheckout({ ticketId, quantity = 1, onSuccess, onError }: EmbeddedCheckoutProps) {
	const [clientSecret, setClientSecret] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current || clientSecret) return;
		initialized.current = true;

		const createPaymentIntent = async () => {
			try {
				const res = await fetch('/api/payments/create-payment-intent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ ticketId, quantity }),
				});
				
				const data = await res.json();
				
				if (data.error) {
					setError(data.error);
					initialized.current = false; // Allow retry
				} else {
					setClientSecret(data.clientSecret);
				}
			} catch (err) {
				console.error('Error creating payment intent:', err);
				setError('Failed to initialize payment');
				initialized.current = false; // Allow retry
			} finally {
				setLoading(false);
			}
		};

		createPaymentIntent();
	}, [ticketId, clientSecret]); // Re-run if ticketId changes or on retry

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<FaSpinner className="h-6 w-6 animate-spin text-primary" />
				<span className="ml-2 text-muted-foreground">Încărcare...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-8 text-center">
				<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-4">
					{error}
				</div>
				<button
					type="button"
					onClick={() => {
						setError('');
						setLoading(true);
						initialized.current = false;
						// Trigger re-run of useEffect
						setClientSecret('');
					}}
					className="text-primary hover:underline"
				>
					Încearcă din nou
				</button>
			</div>
		);
	}

	const appearance = {
		theme: 'stripe' as const,
		variables: {
			colorPrimary: '#DF5739',
			colorBackground: '#0F0F10',
			colorText: '#ffffff',
			colorDanger: '#FF1800',
			fontFamily: 'Inter, system-ui, sans-serif',
			spacingUnit: '4px',
			borderRadius: '6px',
		},
		rules: {
			'.Tab': {
				backgroundColor: '#0F0F10',
				border: '1px solid #DF5739',
				color: '#9ca3af',
			},
			'.Tab--selected': {
				backgroundColor: '#DF5739',
				color: '#ffffff',
			},
			'.Input': {
				backgroundColor: '#0F0F10',
				border: '1px solid #374151',
				color: '#ffffff',
			},
			'.Input:focus': {
				borderColor: '#DF5739',
				boxShadow: '0 0 0 2px rgba(223, 87, 57, 0.2)',
			},
			'.Label': {
				color: '#ffffff',
				fontWeight: '500',
			},
		}
	};

	const options = {
		clientSecret,
		appearance,
		locale: 'ro' as const,
	};

	return (
		<div className="max-w-md mx-auto">
			{clientSecret && (
				<>
					<Elements options={options} stripe={stripePromise}>
						<CheckoutForm onSuccess={onSuccess} onError={onError} />
					</Elements>
				</>
			)}
		</div>
	);
}
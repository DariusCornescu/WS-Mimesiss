'use client';

import {
	Elements,
	PaymentElement,
	useElements,
	useStripe
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { BRAND } from '@/lib/brand';

// Load Stripe outside of component render to avoid recreating
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

interface EmbeddedCheckoutProps {
	ticketId: string;
	quantity?: number;
	onSuccess?: (paymentIntentId: string) => void;
	onError?: (error: string) => void;
}

function CheckoutForm({ onSuccess, onError }: { onSuccess?: (paymentIntentId: string) => void; onError?: (error: string) => void }) {
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
			confirmParams: { return_url: `${window.location.origin}/payment/success` },
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
			onSuccess?.(paymentIntent.id);
		}

		setIsLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Procesare securizată</p>
				<h3 className="mt-2 text-xl font-semibold text-foreground">Alege metoda de plată</h3>
				<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
					Completează datele în formularul securizat de mai jos.
				</p>
			</div>

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
				<div role="alert" aria-live="assertive" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
					{message}
				</div>
			)}

			<button
				type="submit"
				disabled={isLoading || !stripe || !elements}
				className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-accent/50 bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				{isLoading && <FaSpinner className="h-4 w-4 animate-spin" aria-hidden="true" />}
				{isLoading ? 'Se procesează...' : 'Finalizează plata'}
			</button>
		</form>
	);
}

export default function EmbeddedCheckout(props: EmbeddedCheckoutProps) {
  return <PaymentCheckout key={props.ticketId + ':' + (props.quantity || 1)} {...props} />;
}

function PaymentCheckout({ ticketId, quantity = 1, onSuccess, onError }: EmbeddedCheckoutProps) {
	const [clientSecret, setClientSecret] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [pendingPayment, setPendingPayment] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function initialize() {
      try {
        const res = await fetch('/api/payments/create-payment-intent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, quantity }), signal: controller.signal,
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setPendingPayment(data.code === 'payment_pending');
          throw new Error(data.error || 'Nu am putut inițializa plata.');
        }
        setClientSecret(data.clientSecret);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Nu am putut inițializa plata.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void initialize();
    return () => controller.abort();
  }, [ticketId, quantity, retry]);

  async function retryPayment() {
    setLoading(true);
    setError('');
    if (pendingPayment) {
      try {
        const res = await fetch('/api/payments/cancel-pending', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Nu am putut anula plata.');
        setPendingPayment(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nu am putut anula plata.');
        setLoading(false);
        return;
      }
    }
    setRetry(value => value + 1);
  }

	if (loading) {
		return (
			<div role="status" aria-live="polite" className="flex items-center justify-center rounded-lg border border-border bg-card p-8">
				<FaSpinner className="h-6 w-6 animate-spin text-accent" aria-hidden="true" />
				<span className="ml-2 text-muted-foreground">Încărcare...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-border bg-card p-6 text-center sm:p-8">
				<div role="alert" aria-live="assertive" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-foreground">
					{error}
				</div>
				<button
					type="button"
					onClick={retryPayment}
					className="min-h-12 w-full rounded-lg border border-border bg-background px-4 py-3 font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
				>
					{pendingPayment ? 'Anulează plata anterioară și continuă' : 'Încearcă din nou'}
				</button>
			</div>
		);
	}

	const appearance = {
		theme: 'stripe' as const,
		variables: {
			colorPrimary: BRAND.primary,
			colorBackground: BRAND.background,
			colorText: BRAND.foreground,
			colorDanger: BRAND.destructive,
			fontFamily: 'Inter, system-ui, sans-serif',
			spacingUnit: '4px',
			borderRadius: '6px',
		},
		rules: {
			'.Tab': {
				backgroundColor: BRAND.background,
				border: `1px solid ${BRAND.primary}`,
				color: BRAND.mutedForeground,
			},
			'.Tab--selected': {
				backgroundColor: BRAND.primary,
				color: BRAND.onPrimary,
			},
			'.Input': {
				backgroundColor: BRAND.background,
				border: `1px solid ${BRAND.neutralBorder}`,
				color: BRAND.foreground,
			},
			'.Input:focus': {
				borderColor: BRAND.accent,
				boxShadow: `0 0 0 2px ${BRAND.accent}33`,
			},
			'.Label': {
				color: BRAND.foreground,
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
		<div className="mx-auto max-w-md rounded-lg border border-border bg-card p-5 shadow-lg sm:p-6">
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

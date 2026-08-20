import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// Stripe webhook signature verification
export const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper function to construct event from raw body and signature
export function constructEvent(body: string, signature: string) {
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
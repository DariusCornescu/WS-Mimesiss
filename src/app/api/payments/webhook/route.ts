import { NextResponse } from 'next/server'
import { constructEvent } from '@/lib/stripe'
import { fulfillPayment } from '@/lib/payment-fulfillment'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })
  let event
  try { event = constructEvent(await request.text(), signature) }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }) }
  const keyMode = /^(?:sk|rk)_(test|live)_/.exec(process.env.STRIPE_SECRET_KEY ?? '')?.[1]
  if (!keyMode || event.livemode !== (keyMode === 'live')) {
    return NextResponse.json({ error: 'Wrong payment environment' }, { status: 400 })
  }
  try {
    if (event.type === 'payment_intent.succeeded') await fulfillPayment(event.data.object)
    return NextResponse.json({ received: true })
  } catch {
    // Non-2xx asks Stripe to retry. No success until the transaction commits.
    console.error('Payment fulfillment failed', { eventId: event.id })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

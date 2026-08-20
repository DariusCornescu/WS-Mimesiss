import { NextRequest, NextResponse } from 'next/server';
import { constructEvent } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import { Payment, Counter, IssuedTicket } from '@/models';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event = null;

  try {
    event = constructEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretLength: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
      signatureHeader: `${signature.substring(0, 20)}...`,
      bodyLength: body.length
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectDB();

  switch (event.type) {

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      
      try {
        // Extract metadata from the payment intent
        const clerkId = paymentIntent.metadata?.clerkId;
        const ticketId = paymentIntent.metadata?.ticketId;
        const ticketType = paymentIntent.metadata?.ticketType;
        const ticketCategory = (paymentIntent.metadata?.ticketCategory || 'workshop') as 'workshop' | 'ball';
        const ticketTitle = paymentIntent.metadata?.ticketTitle;
        const userName = paymentIntent.metadata?.userName;
        const userEmail = paymentIntent.metadata?.userEmail;
        const userType = paymentIntent.metadata?.userType;
        const eventName = paymentIntent.metadata?.eventName;
        const eventLocation = paymentIntent.metadata?.eventLocation;
        const quantity = parseInt(paymentIntent.metadata?.quantity || '1') || 1;

        if (!clerkId || !ticketId || !ticketType) {
          console.error('Missing required metadata in PaymentIntent:', paymentIntent.id);
          return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
        }

        // Check if payment record already exists (avoid duplicates)
        let payment = await Payment.findOne({
          stripePaymentIntentId: paymentIntent.id
        });

        if (!payment) {
          // Create new payment record
          payment = new Payment({
            clerkId,
            stripeSessionId: paymentIntent.id,
            stripePaymentIntentId: paymentIntent.id,
            ticketId,
            ticketType,
            ticketCategory,
            quantity,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            status: 'completed',
            metadata: {
              ticketTitle: ticketTitle || '',
              userName: userName || '',
              userEmail: userEmail || '',
              userType: userType || 'student',
              eventName: eventName || 'MIMESISS 2025',
              eventLocation: eventLocation || 'București, România',
            },
          });
          await payment.save();
        } else {
          payment.status = 'completed';
          payment.ticketId = ticketId;
          payment.ticketType = ticketType;
          payment.ticketCategory = ticketCategory;
          payment.quantity = quantity;
          await payment.save();
        }

        // Create individual IssuedTicket documents (one per physical ticket)
        const paymentObjectId = (payment._id as { toString(): string }).toString();
        const alreadyIssued = await IssuedTicket.countDocuments({ paymentId: paymentObjectId });
        if (alreadyIssued === 0) {
          for (let i = 0; i < quantity; i++) {
            const counter = await Counter.findOneAndUpdate(
              { _id: 'issuedTicket' },
              { $inc: { seq: 1 } },
              { new: true, upsert: true }
            );
            await IssuedTicket.create({
              ticketNumber: counter!.seq,
              clerkId,
              paymentId: paymentObjectId,
              ticketTypeId: ticketId,
              ticketTitle: ticketTitle || ticketType,
              ticketType,
              category: ticketCategory,
              pricePerTicket: Math.round(paymentIntent.amount / quantity),
              currency: paymentIntent.currency.toUpperCase(),
            });
          }
        }

      } catch (error) {
        console.error('Error processing completed PaymentIntent:', error);
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log('PaymentIntent failed:', {
        paymentIntentId: paymentIntent.id,
        clerkId: paymentIntent.metadata?.clerkId,
        amount: paymentIntent.amount,
        lastPaymentError: paymentIntent.last_payment_error?.message
      });
      break;
    }

    default:
      console.log('Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// Disable body parsing to get raw body for webhook verification
export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: { 'Allow': 'POST', 'Content-Type': 'application/json' },
  });
}
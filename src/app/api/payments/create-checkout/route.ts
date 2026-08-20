import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import { Payment, Ticket } from '@/models';
import { Ticket as TicketInterface } from '@/types/models';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    const data = await req.json();

    console.log('Request data:', data);

    const { ticketId } = data;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // Get ticket details from database
    const ticket = await Ticket.findById(ticketId).lean() as TicketInterface | null;

    if (!ticket) {
      return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 });
    }
  
    // Check if user already has a completed payment for this ticket type
    const existingPayment = await Payment.findOne({
      clerkId: user.id,
      ticketType: ticket.type,
      status: 'completed'
    });

    if (existingPayment) {
      return NextResponse.json({ 
        error: 'Aveți deja un bilet de acest tip' 
      }, { status: 400 });
    }

    // Create Stripe checkout session
    // Convert price from RON to bani (cents) - multiply by 100
    const amountInBani = Math.round(ticket.price * 100);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ron',
            product_data: {
              name: ticket.title,
              description: ticket.description,
              images: [`${process.env.NEXT_PUBLIC_BASE_URL}/icons/logo.png`],
            },
            unit_amount: amountInBani,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      customer_email: user.emailAddresses[0]?.emailAddress,
      metadata: {
        clerkId: user.id,
        ticketId: ticket._id?.toString() || ticketId,
        ticketType: ticket.type,
        ticketTitle: ticket.title,
        userName: `${user.firstName} ${user.lastName}`.trim(),
      },
    });

    // Payment record will be created only when payment succeeds via webhook

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
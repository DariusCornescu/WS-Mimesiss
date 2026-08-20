import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import connectDB from '@/lib/mongodb';
import { Payment, Ticket } from '@/models';
import { User } from '@/models';
import { User as UserInterface, Ticket as TicketInterface } from '@/types/models';
import { getAppSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Connect to database
    await connectDB();

    const [userData, appSettings] = await Promise.all([
      User.findOne({ clerkId: user.id }).lean() as Promise<UserInterface | null>,
      getAppSettings(),
    ]);

    const data = await req.json();
    const { ticketId, quantity: rawQuantity } = data;
    const quantity = Math.max(1, parseInt(rawQuantity) || 1);

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    // Get ticket details from database
    const ticket = await Ticket.findById(ticketId).lean() as TicketInterface | null;

    if (!ticket) {
      return NextResponse.json({ error: 'Invalid ticket type' }, { status: 400 });
    }

    const isBallTicket = ticket.category === 'ball';

    if (isBallTicket) {
      // For ball tickets: check cumulative purchased quantity
      const existingPayments = await Payment.find({
        clerkId: user.id,
        ticketId: ticket._id?.toString() || ticketId,
        status: 'completed',
      });
      const alreadyPurchased = existingPayments.reduce((sum: number, p: { quantity?: number }) => sum + (p.quantity || 1), 0);
      const maxAllowed = appSettings.ballMaxTicketsPerUser ?? 2;

      if (alreadyPurchased + quantity > maxAllowed) {
        const remaining = maxAllowed - alreadyPurchased;
        return NextResponse.json({
          error: remaining <= 0
            ? `Ați atins limita maximă de ${maxAllowed} bilete per persoană`
            : `Puteți cumpăra maxim ${remaining} bilet(e) în plus (limita: ${maxAllowed})`,
        }, { status: 400 });
      }
    } else {
      // Workshop tickets: one per type only
      const existingPayment = await Payment.findOne({
        clerkId: user.id,
        ticketType: ticket.type,
        status: 'completed',
      });
      if (existingPayment) {
        return NextResponse.json({
          error: 'Aveți deja un bilet de acest tip'
        }, { status: 400 });
      }
    }

    // Convert price from RON to bani (cents) - multiply by 100, then by quantity
    const amountInBani = Math.round(ticket.price * quantity * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInBani,
      currency: 'ron',
      description: quantity > 1
        ? `${ticket.title} x${quantity} - MIMESISS 2025`
        : `${ticket.title} - MIMESISS 2025`,
      receipt_email: userData?.email || '',
      metadata: {
        clerkId: user.id,
        ticketId: ticket._id?.toString() || ticketId,
        ticketType: ticket.type,
        ticketCategory: ticket.category || 'workshop',
        ticketTitle: ticket.title,
        quantity: String(quantity),
        userName: `${user.firstName} ${user.lastName}`.trim(),
        userEmail: userData?.email || '',
        userType: userData?.userType || 'student',
        eventName: 'MIMESISS 2025',
        eventLocation: 'București, România',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Payment record will be created only when payment succeeds via webhook
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    });

  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

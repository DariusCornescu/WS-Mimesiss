import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createTicketPayment } from '@/app/admin/payments/actions';
import { requireRole, toAuthResponse } from '@/lib/auth';
import type { Payment } from '@/types/models';

export async function POST(request: NextRequest) {
	try {
		await requireRole('admin');

		const paymentData: Partial<Payment> = await request.json();

		console.log('Received payment data:', paymentData);

		// Validate required fields
		if (!paymentData.clerkId || !paymentData.ticketId || !paymentData.amount) {
			console.error('Missing required fields:', { 
				clerkId: paymentData.clerkId, 
				ticketId: paymentData.ticketId, 
				amount: paymentData.amount 
			});
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}


		console.log('Creating payment with data:', paymentData);

		const newPayment = await createTicketPayment(paymentData);

		console.log('Payment created successfully:', newPayment);

		return NextResponse.json(newPayment, { status: 201 });
	} catch (error) {
		const authResponse = toAuthResponse(error);
		if (authResponse) {
			return authResponse;
		}

		console.error('Error creating payment:', error);
		console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
		return NextResponse.json(
			{ 
				error: 'Failed to create payment',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}

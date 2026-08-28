import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createTicketPayment } from '@/app/admin/payments/actions';
import { requireRole, toAuthResponse } from '@/lib/auth';
import { parseWith, manualPaymentInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
	try {
		await requireRole('admin');

		const parsed = parseWith(manualPaymentInput, await request.json());

		if (!parsed.ok) {
			return NextResponse.json({ error: parsed.error }, { status: 400 });
		}

		// Whitelist-pick: only the parsed fields reach the model.
		const newPayment = await createTicketPayment(parsed.data);

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

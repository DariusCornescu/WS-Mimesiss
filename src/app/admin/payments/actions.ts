import type { Payment } from "@/types/models";
import { Payment as PaymentModel } from "@/models";
import connectDB from "@/lib/mongodb";

export async function createTicketPayment(paymentData: Partial<Payment>): Promise<Payment> {
	await connectDB();

	const payment = new PaymentModel(paymentData);
	await payment.save();

	return JSON.parse(JSON.stringify(payment)) as Payment;
}

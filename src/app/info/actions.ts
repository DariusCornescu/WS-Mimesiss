
import type { Ticket as TicketType } from "@/types/models";
import { Ticket } from "@/models";
import connectDB from "@/lib/mongodb";

export async function getTicketByType(ticketType: string): Promise<TicketType | null> {
	await connectDB();

	const ticket = await Ticket.findOne({ type: ticketType }).lean();
	if (!ticket) {
		return null;
	}

	return JSON.parse(JSON.stringify(ticket)) as TicketType;
}

export async function getAllTickets(): Promise<TicketType[]> {
	await connectDB();

	const tickets = await Ticket.find().lean();
	if (!tickets) {
		throw new Error('No tickets found');
	}

	// Convert to plain objects to ensure serializability
	return JSON.parse(JSON.stringify(tickets)) as TicketType[];
}
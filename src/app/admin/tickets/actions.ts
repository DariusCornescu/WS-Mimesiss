'use server'

import { revalidatePath } from "next/cache";
import { Ticket as TicketType } from "@/types/models";
import { Ticket } from "@/models";
import { requireRole } from "@/lib/auth";
import { parseWith, ticketCreateInput, ticketUpdateInput } from "@/lib/validation";
import { ticketsTaken } from "@/lib/ticket-stock";

// Get all tickets
export async function getAllTickets(): Promise<TicketType[]> {
	await requireRole('admin');

	const tickets = await Ticket.find().lean();
	if (!tickets) {
		throw new Error('No tickets found');
	}

	// Convert to plain objects to ensure serializability
	const plain = JSON.parse(JSON.stringify(tickets)) as TicketType[];
	const taken = await ticketsTaken(plain.map(ticket => String(ticket._id)));
	return plain.map(ticket => ({ ...ticket, sold: taken.get(String(ticket._id)) ?? 0 }));
}

export async function createTicket(data: {
	title: string;
	description: string;
	price: number;
	features: string[];
	type: string;
	enabled?: boolean;
	category?: 'workshop' | 'ball';
	maxQuantity?: number | null;
}): Promise<void> {
	await requireRole('admin');

	const parsed = parseWith(ticketCreateInput, data);
	if (!parsed.ok) {
		throw new Error(parsed.error);
	}

	const ticket = new Ticket({
		...parsed.data,
		enabled: parsed.data.enabled ?? true,
		category: parsed.data.category ?? 'workshop',
		maxQuantity: parsed.data.maxQuantity ?? null,
	});
	await ticket.save();
	revalidatePath('/admin/tickets');
}

export async function updateTicket(ticketId: string, data: {
	title?: string;
	description?: string;
	price?: number;
	features?: string[];
	type?: string;
	enabled?: boolean;
	category?: 'workshop' | 'ball';
	maxQuantity?: number | null;
}): Promise<void> {
	await requireRole('admin');

	const parsed = parseWith(ticketUpdateInput, data);
	if (!parsed.ok) {
		throw new Error(parsed.error);
	}

	const ticket = await Ticket.findById(ticketId);
	if (!ticket) {
		throw new Error('Ticket not found');
	}

	ticket.title = parsed.data.title ?? ticket.title;
	ticket.description = parsed.data.description ?? ticket.description;
	ticket.price = parsed.data.price ?? ticket.price;
	ticket.features = parsed.data.features ?? ticket.features;
	ticket.type = parsed.data.type ?? ticket.type;
	ticket.enabled = parsed.data.enabled ?? ticket.enabled;
	if (parsed.data.category) ticket.category = parsed.data.category;
	// null clears the limit; undefined leaves it as it is.
	if (parsed.data.maxQuantity !== undefined) ticket.maxQuantity = parsed.data.maxQuantity;
	await ticket.save();

	revalidatePath('/admin/tickets');
}


export async function deleteTicket(ticketId: string): Promise<void> {
	await requireRole('admin');

	const ticket = await Ticket.deleteOne({_id: ticketId});
	if (!ticket) {
		throw new Error('Ticket not found');
	}
}

export async function getTicketById(ticketId: string): Promise<TicketType | null> {
	await requireRole('admin');

	const ticket = await Ticket.findById(ticketId).lean();
	if (!ticket) {
		return null;
	}

	// Convert to plain object to ensure serializability
	return JSON.parse(JSON.stringify(ticket)) as TicketType;
}
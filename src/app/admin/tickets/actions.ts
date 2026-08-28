'use server'

import { revalidatePath } from "next/cache";
import { Ticket as TicketType } from "@/types/models";
import { Ticket } from "@/models";
import { requireRole } from "@/lib/auth";
import { parseWith, ticketCreateInput, ticketUpdateInput } from "@/lib/validation";

// Get all tickets
export async function getAllTickets(): Promise<TicketType[]> {
	await requireRole('admin');

	const tickets = await Ticket.find().lean();
	if (!tickets) {
		throw new Error('No tickets found');
	}

	// Convert to plain objects to ensure serializability
	return JSON.parse(JSON.stringify(tickets)) as TicketType[];
}

export async function createTicket(data: {
	title: string;
	description: string;
	price: number;
	features: string[];
	type: string;
	enabled?: boolean;
	category?: 'workshop' | 'ball';
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
import { currentUser } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { syncUserWithDatabase } from '@/lib/auth'
import { User as UserType } from '@/types/models'
import { getTicketById } from '../actions'
import EditTicketForm from '@/components/admin/EditTicketForm'

interface EditTicketPageProps {
	params: Promise<{
		id: string
	}>
}

export default async function EditTicketPage({ params }: EditTicketPageProps) {
	const clerkUser = await currentUser()

	if (!clerkUser) {
		redirect('/auth/login')
	}

	// Sync user and check if admin
	const user: UserType = await syncUserWithDatabase(clerkUser)

	if (user.role !== 'admin') {
		redirect('/unauthorized')
	}

	// Await params before using
	const { id } = await params

	// Fetch the ticket
	const ticket = await getTicketById(id)

	if (!ticket) {
		notFound()
	}

	// Prepare serialized ticket data for the client component
	const ticketData = {
		id: ticket._id?.toString() || ticket.id?.toString() || id,
		title: ticket.title,
		description: ticket.description,
		price: ticket.price,
		features: ticket.features,
		type: ticket.type,
		enabled: ticket.enabled,
		category: ticket.category || 'workshop',
	}

	return <EditTicketForm ticket={ticketData} />
}

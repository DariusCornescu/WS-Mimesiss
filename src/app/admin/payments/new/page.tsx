import { getAllTickets } from "@/app/info/actions";
import { fetchAllUsers } from "@/app/admin/users/actions";
import PaymentForm from "@/components/payments/PaymentForm";

export default async function NewPaymentPage() {
	// select user and a ticket to create a new payment for the user and update the access level accordingly
	const users = await fetchAllUsers();

	const eligibleUsers = users;
	const tickets = await getAllTickets();

	return (
		<PaymentForm users={eligibleUsers} tickets={tickets} />
	);
}

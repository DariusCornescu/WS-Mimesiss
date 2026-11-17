import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { syncUserWithDatabase } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

/**
 * Target of the QR printed on every issued ticket. Phone cameras open the
 * link directly, so staff land on the validation page and everyone else on
 * their own tickets. The ticket itself is only shown after a role check on
 * the destination page.
 */
export async function GET(
	_req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const clerkUser = await currentUser();

	if (!clerkUser) redirect('/auth/login');

	await connectDB();
	const user = await syncUserWithDatabase(clerkUser);

	const isStaff = user?.role === 'admin' || user?.role === 'moderator';
	if (isStaff && mongoose.isValidObjectId(id)) {
		redirect(`/dashboard/moderator/tickets/${id}`);
	}

	redirect('/dashboard/tickets');
}

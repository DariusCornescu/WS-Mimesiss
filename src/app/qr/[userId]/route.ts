import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncUserWithDatabase } from '@/lib/auth';
import connectDB from '@/lib/mongodb';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	const { userId } = await params;
	const currentUserData = await currentUser();

	// If no current user, redirect to profile
	if (!currentUserData) {
		redirect('/program');
	}
	await connectDB();

	const userData = await syncUserWithDatabase(currentUserData);

	if (!userData) {
		// If user not found, redirect sign-in
		redirect('/auth/sign-in');
	}

	const isModerator = userData.role === 'moderator';

	if (isModerator) {
		// Moderator: redirect to moderator attendance page
		redirect(`/dashboard/moderator/attendance/${userId}`);
	}

	// Check if current user is admin
	const isAdmin = userData.role === 'admin';

	if (isAdmin) {
		// Admin: redirect to attendance confirmation page
		redirect(`/admin/attendance/${userId}`);
	} else {
		// Regular user: redirect to their profile
		redirect('/program');
	}
}
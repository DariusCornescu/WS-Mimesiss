import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { Registration } from '@/models';
import { syncUserWithDatabase } from '@/lib/auth';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await params;
		const currentUserData = await currentUser();

		if (!currentUserData) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userData = await syncUserWithDatabase(currentUserData);

		// Check if current user is admin
		const isAdmin = userData?.role === 'admin' || userData?.role === 'moderator';
		if (!isAdmin) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get user registrations with workshop details
		const registrations = await Registration.find({ userId })
			.populate('workshopId')
			.maxTimeMS(5000)
			.exec();

		// Transform the data to include workshop details in the expected format
		const transformedRegistrations = registrations.map(reg => ({
			_id: reg._id,
			workshopId: reg.workshopId._id,
			workshop: {
				_id: reg.workshopId._id,
				title: reg.workshopId.title,
				date: reg.workshopId.date,
				time: reg.workshopId.time,
				location: reg.workshopId.location,
				instructor: reg.workshopId.instructor
			},
			status: reg.status,
			attendance: reg.attendance || { confirmed: false }
		}));

		return NextResponse.json({
			user: {
				id: userData.clerkId,
				firstName: userData.firstName,
				lastName: userData.lastName,
				email: userData.email,
				userType: userData.userType
			},
			registrations: transformedRegistrations
		});

	} catch (error) {
		console.error('Error fetching attendance data:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH(
	req: NextRequest,
) {
	try {
		const currentUserData = await currentUser();

		if (!currentUserData) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if current user is admin or moderator
		const userData = await syncUserWithDatabase(currentUserData);
		const isAdmin = userData?.role === 'admin' || userData?.role === 'moderator';
		if (!isAdmin) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		const { registrationId, confirmed } = await req.json();

		if (!registrationId || confirmed === undefined) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Ensure database connection with timeout
		const connection = await connectDB();
		if (!connection || connection.connection.readyState !== 1) {
			console.error('Database connection failed');
			return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
		}

		// Update the registration attendance
		const updateData = {
			'attendance.confirmed': confirmed,
			'attendance.confirmedAt': confirmed ? new Date() : null,
			'attendance.confirmedBy': confirmed ? currentUserData.id : null
		};

		const registration = await Registration.findByIdAndUpdate(
			registrationId,
			updateData,
			{ new: true, maxTimeMS: 5000 }
		);

		if (!registration) {
			return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			message: `Prezența a fost ${confirmed ? 'confirmată' : 'anulată'}`
		});

	} catch (error) {
		console.error('Error updating attendance:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Registration, Workshop, User as MongoUser } from '@/models';
import { requireRole, toAuthResponse } from '@/lib/auth';
import type { User as UserType } from '@/types/models';
import { parseWith, attendancePatchInput } from '@/lib/validation';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ userId: string }> }
) {
	try {
		const { userId } = await params;

		// requireRole also syncs the caller and establishes the DB connection.
		await requireRole('admin', 'moderator');

		// The scanned user's profile — NOT the caller's (the old code returned
		// the caller, and crashed on populate() over a ref-less string field).
		const targetUser = await MongoUser.findOne({ clerkId: userId }).lean() as UserType | null;
		if (!targetUser) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const registrations = await Registration.find({ userId }).lean();

		// Manual join: Registration.workshopId is a plain string with no ref,
		// so populate() cannot be used on it.
		const workshopIds = registrations.map(reg => reg.workshopId);
		const workshops = await Workshop.find({ _id: { $in: workshopIds } })
			.select('title date time location instructor')
			.lean();
		const workshopMap = new Map<string, (typeof workshops)[number]>();
		for (const workshop of workshops) {
			workshopMap.set(String(workshop._id), workshop);
		}

		const transformedRegistrations = registrations.map(reg => {
			const workshop = workshopMap.get(String(reg.workshopId));
			return {
				_id: reg._id,
				workshopId: reg.workshopId,
				workshop: workshop ? {
					_id: workshop._id,
					title: workshop.title,
					date: workshop.date,
					time: workshop.time,
					location: workshop.location,
					instructor: workshop.instructor,
				} : null,
				attendance: reg.attendance || { confirmed: false },
			};
		});

		return NextResponse.json({
			user: {
				id: targetUser.clerkId,
				firstName: targetUser.firstName,
				lastName: targetUser.lastName,
				email: targetUser.email,
				userType: targetUser.userType,
			},
			registrations: transformedRegistrations,
		});

	} catch (error) {
		const authResponse = toAuthResponse(error);
		if (authResponse) {
			return authResponse;
		}
		console.error('Error fetching attendance data:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PATCH(
	req: NextRequest,
) {
	try {
		const caller = await requireRole('admin', 'moderator');

		const parsed = parseWith(attendancePatchInput, await req.json());

		if (!parsed.ok) {
			return NextResponse.json({ error: parsed.error }, { status: 400 });
		}

		const { registrationId, confirmed } = parsed.data;

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
			'attendance.confirmedBy': confirmed ? caller.clerkId : null
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
		const authResponse = toAuthResponse(error);
		if (authResponse) {
			return authResponse;
		}
		console.error('Error updating attendance:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
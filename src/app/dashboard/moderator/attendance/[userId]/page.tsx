
import { FaUser, FaCalendarCheck } from 'react-icons/fa';
import { getUser } from '@/app/dashboard/profile/actions';
import connectDB from '@/lib/mongodb';
import { Registration, Workshop } from '@/models';
import AttendanceToggle from '@/components/AttendanceToggle';
import { currentUser } from '@clerk/nextjs/server';
import { syncUserWithDatabase } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AttendancePage({ params }: { params: Promise<{ userId: string }> }) {
	const { userId } = await params;

	// Check authentication and authorization
	const clerkUser = await currentUser();
	
	if (!clerkUser) {
		redirect('/auth/login');
	}

	// Sync user and check if admin or moderator
	const currentDbUser = await syncUserWithDatabase(clerkUser);
	
	if (currentDbUser.role !== 'admin' && currentDbUser.role !== 'moderator') {
		redirect('/unauthorized');
	}

	// Fetch user data from database
	const user = await getUser(userId);

	if (!user) {
		return (
			<div className="container mx-auto py-8">
				<div className="mimesiss-card p-6">
					<div className="text-center text-destructive">
						Utilizatorul nu a fost găsit. Vă rugăm să încercați din nou.
					</div>
				</div>
			</div>
		);
	}

	// Fetch registrations and workshops separately - much simpler
	await connectDB();
	const registrations = await Registration.find({ userId: user.clerkId }).lean();

	// Get all workshop IDs from registrations
	const workshopIds = registrations.map((reg) => reg.workshopId);

	// Fetch all workshops at once
	const workshops = await Workshop.find({ _id: { $in: workshopIds } }).lean();

	// Create a workshop lookup map
	const workshopMap = Object.fromEntries(
		workshops.map(workshop => [String(workshop._id), workshop])
	);

	// Combine registrations with workshops
	const registrationsWithWorkshops = registrations
		.filter((reg) => workshopMap[reg.workshopId])
		.map((reg) => ({
			...reg,
			_id: String(reg._id),
			workshop: workshopMap[reg.workshopId],
			attendance: reg.attendance || { confirmed: false }
		}));

	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-4">Confirmare Prezență</h1>

				{/* User Info Card */}
				<div className="mimesiss-card p-6 mb-6">
					<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
						<FaUser className="text-primary" />
						Informații Utilizator
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="font-semibold text-muted-foreground">Nume:</p>
							<p className="text-foreground">{user.firstName} {user.lastName}</p>
						</div>
						<div>
							<p className="font-semibold text-muted-foreground">Email:</p>
							<p className="text-foreground">{user.email}</p>
						</div>
						<div>
							<p className="font-semibold text-muted-foreground">Tip Utilizator:</p>
							<span className="inline-block bg-muted text-foreground px-2 py-1 rounded text-sm">
								{user.userType}
							</span>
						</div>
					</div>
				</div>

				{/* Registrations */}
				<div className="space-y-4">
					<h2 className="text-2xl font-semibold flex items-center gap-2">
						<FaCalendarCheck className="text-primary" />
						Înnregistrări Workshop-uri
					</h2>

					{registrationsWithWorkshops.length === 0 ? (
						<div className="mimesiss-card p-6">
							<div className="text-center text-muted-foreground">
								Nu au fost găsite înregistrări pentru acest utilizator.
							</div>
						</div>
					) : (
						registrationsWithWorkshops.map((registration) => (
							<div key={registration._id} className="mimesiss-card border-l-4 border-l-primary">
								<div className="p-6">
									<div className="mb-4">
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="text-lg font-semibold mb-2 text-foreground">
													{registration.workshop.title}
												</h3>
												<div className="text-sm text-muted-foreground space-y-1">
													<p>Tip: {registration.workshop.wsType}</p>
													<p>Data: {new Date(registration.workshop.date).toLocaleDateString('ro-RO')}</p>
													<p>Ora: {registration.workshop.time}</p>
													<p>Locația: {registration.workshop.location}</p>
													<p>Instructor: {registration.workshop.instructor}</p>

												</div>
											</div>
											<div className="flex flex-col items-end gap-2">
												<span className={`inline-block px-2 py-1 rounded text-sm ${registration.attendance.status === 'confirmed'
														? 'bg-primary/10 text-primary border border-primary/20'
														: 'bg-muted text-muted-foreground'
													}`}>
													{registration.attendance.status}
												</span>
											</div>
										</div>
									</div>

									<AttendanceToggle
										registrationId={registration._id}
										userId={userId}
										initialStatus={registration.attendance.confirmed}
										confirmedAt={registration.attendance.confirmedAt?.toString()}
									/>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}

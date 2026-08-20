import { getUserRegistrations } from '@/app/workshops/actions'
import { syncUserWithDatabase } from '@/lib/auth'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import type { User as UserType } from '@/types/models'
import Link from 'next/link'
import { FaCircle, FaCheckCircle, FaTimes } from 'react-icons/fa'
import { getAppSettings } from '@/lib/settings'

export default async function RegistrationsPage() {
	const clerkUser = await currentUser()

	if (!clerkUser) {
		redirect('/auth/login')
	}

	const user: UserType = await syncUserWithDatabase(clerkUser)


	// Fetch  user registrations
	const registrations = await getUserRegistrations(user.clerkId)

	//get app settings
	const appSettings = await getAppSettings()

	const workshopVisibleToPublic = appSettings.workshopVisibleToPublic || false

	return (
		<>
			<h1>
				Inregistrarile mele
			</h1>
			<div className="mt-5">
				{registrations.length > 0 ? (
					<ul className="divide-y divide-border">
						{registrations.map((registration) => (
							<li key={registration._id} className="py-4 flex items-center justify-between">
								<div>
									<p className="text-sm font-medium text-foreground">{registration.workshop.title}</p>
									<div className="flex items-center space-x-2 text-sm text-muted-foreground">
										{registration.workshop.date && (
											<>
												<span>{new Date(registration.workshop.date).toLocaleDateString()}</span>
												<FaCircle className="inline-block size-[8px] fill-current" />
											</>
										)}
										{registration.workshop.location && (
											<>
												<span>{registration.workshop.location}</span>
												<FaCircle className="inline-block size-[8px] fill-current" />
											</>
										)}
										<span>
											{registration.workshop.wsType === 'conferinta'
												? `${registration.workshop.currentParticipants} participanți (nelimitat)`
												: `${registration.workshop.currentParticipants} / ${registration.workshop.maxParticipants} locuri ocupate`
											}
										</span>
									</div>

									<div>
										{registration.attendance.confirmed ? (
											<span className="inline-flex items-center px-2 py-1 mt-1 rounded text-sm bg-green-100 text-green-800">
												<FaCheckCircle className="mr-1" /> Prezență confirmată
											</span>
										) : (
											<span className="inline-flex items-center px-2 py-1 mt-1 rounded text-sm bg-red-100 text-red-800">
												<FaTimes className="mr-1" /> Prezență neconfirmată
											</span>
										)}
									</div>
								</div>
								{workshopVisibleToPublic && (
									<Link
										href={`/workshops/${registration.workshop._id || registration.workshop.id || ''}`}
										className="text-sm font-medium text-primary hover:underline"
									>
										Detalii {registration.workshop.wsType === 'workshop' ? 'Workshop' : 'Conferință'}
									</Link>
								)}
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">Nu ai nicio înregistrare la workshopuri. <Link href="/workshops">Vezi workshopurile disponibile</Link></p>
				)}
			</div>
		</>
	)
}
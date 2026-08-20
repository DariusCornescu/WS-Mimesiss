'use client'

import { useState } from 'react'
import Link from 'next/link';
import type { Workshop, UserWithAttendance } from '@/types/models';
import { FaCalendarAlt, FaEdit, FaUsers, FaMapMarkerAlt, FaUser, FaChevronDown, FaChevronUp, FaLink, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import DeleteWorkshopButton from '@/components/admin/DeleteWorkshopButton'
import { RemoveUserButton } from '@/components/admin/RemoveUserButton'

export default function WorkshopAdminRow({ workshop, registrations }: { workshop: Workshop, registrations: UserWithAttendance[] }) {
	const [isExpanded, setIsExpanded] = useState(false)

	return (
		<li key={workshop._id?.toString() || workshop.id || ''}>
			<div className="px-3 py-4 sm:px-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
					<div className="flex-1 min-w-0">
						<div className="space-y-2">
							<div className="text-sm font-medium text-foreground flex items-center space-x-2">
									<span>{workshop.title} </span>
									<span className="pill">{workshop.wsType ? workshop.wsType : 'N/A'}</span>
									{workshop.url && (
										<Link href={`${workshop.url}`} target="_blank" className="inline-flex items-center text-sm text-primary hover:underline mt-1">
											<FaLink className="mr-1 h-4 w-4" />
										</Link>
									)}
							</div>
							<div>
								<p className="text-sm text-muted-foreground line-clamp-2">
									{workshop.description}
								</p>

							</div>
						</div>
					</div>
					<div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 sm:ml-4">
						<div className="flex space-x-2">
							<Link
								href={`/admin/workshops/edit/${workshop._id?.toString() || workshop.id}`}
								className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-foreground bg-primary hover:bg-primary/90"
							>
								<FaEdit className="mr-1 h-3 w-3" />
								<span className="hidden sm:inline">Editează</span>
								<span className="sm:hidden">Edit</span>
							</Link>
							<DeleteWorkshopButton
								workshopId={workshop._id?.toString() || workshop.id || ''}
								workshopTitle={workshop.title}
							/>
						</div>
					</div>
				</div>
				<div className="mt-3 flex flex-col sm:flex-row sm:items-center text-sm text-muted-foreground space-y-2 sm:space-y-0 sm:space-x-4">
					{workshop.date && (
						<div className="flex items-center">
							<FaCalendarAlt className="flex-shrink-0 mr-1.5 h-4 w-4" />
							<span className="truncate">{new Date(workshop.date).toLocaleDateString('ro-RO')} la {workshop.time}</span>
						</div>
					)}
					{workshop.location && (
						<div className="flex items-center">
							<FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4" />
							<span className="truncate">{workshop.location}</span>
						</div>
					)}
					<div className="flex items-center">
						<FaUsers className="flex-shrink-0 mr-1.5 h-4 w-4" />
						<span>
							{workshop.wsType === 'conferinta' 
								? `${workshop.currentParticipants || 0} participanți (nelimitat)`
								: `${workshop.currentParticipants || 0}/${workshop.maxParticipants} participanți`
							}
						</span>
					</div>
					{workshop.instructor && (
						<div className="flex items-center">
							<FaUser className="flex-shrink-0 mr-1.5 h-4 w-4" />
							<span className="truncate">{workshop.instructor}</span>
						</div>
					)}
				</div>

				{/* Expandable Users Section */}
				<div className="mt-4 border-t border-border pt-3">
					<button
						type="button"
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex items-center justify-between w-full text-left hover:bg-muted/50 rounded px-2 py-1 transition-colors"
					>
						<h4 className="text-sm font-medium text-foreground">
							Utilizatori înregistrați ({registrations?.length || 0})
						</h4>
						{isExpanded ? (
							<FaChevronUp className="h-4 w-4 text-muted-foreground" />
						) : (
							<FaChevronDown className="h-4 w-4 text-muted-foreground" />
						)}
					</button>

					{isExpanded && (
						<div className="mt-2">
							{registrations && registrations.length > 0 ? (
								<table className="min-w-full divide-y divide-border">
									<thead>
										<tr>
											<th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Utilizator</th>
											<th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Email</th>
											<th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Prezență</th>
											<th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Acțiuni</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{registrations.map((user: UserWithAttendance) => (
											<tr key={user._id} className="hover:bg-muted">
												<td className="px-4 py-2 text-sm text-foreground">{user.firstName} {user.lastName}</td>
												<td className="px-4 py-2 text-sm text-muted-foreground">{user.email}</td>
												<td className="px-4 py-2 text-sm">
													{user.attendance?.confirmed ? (
														<div className="flex items-center space-x-1 text-green-600">
															<FaCheckCircle className="h-4 w-4" />
															<span>Confirmat</span>
														</div>
													) : (
														<div className="flex items-center space-x-1 text-gray-400">
															<FaTimesCircle className="h-4 w-4" />
															<span>Neconfirmat</span>
														</div>
													)}
												</td>
												<td className="px-4 py-2 text-sm text-muted-foreground">
													<div className="flex items-center space-x-3">
														<Link href={`/admin/attendance/${user.clerkId}`} className="text-primary hover:underline">
															Prezenta
														</Link>
														<RemoveUserButton 
															userId={user.clerkId}
															workshopId={workshop._id?.toString() || workshop.id || ''}
															userName={`${user.firstName} ${user.lastName}`}
														/>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							) : (
								<p className="text-sm text-muted-foreground px-2 py-3">Niciun utilizator înregistrat</p>
							)}
						</div>
					)}
				</div>
			</div>

		</li>
	);
}
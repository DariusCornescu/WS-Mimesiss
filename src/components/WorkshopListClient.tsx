'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaSearch } from 'react-icons/fa';
import type { Workshop } from '@/types/models';
import Card from '@/components/ui/Card';
// registration context not needed on the list page

// This is the same type from your server component
type ExtendedWorkshop = {
	_id: string;
	id?: string;
	isRegistered: boolean;
} & Omit<Workshop, 'date' | 'createdAt' | 'updatedAt' | '_id' | 'id'> & {
	date: string | null;
	createdAt: string | null;
	updatedAt: string | null;
};

interface WorkshopListClientProps {
	initialWorkshops: ExtendedWorkshop[];
}

const FILTER_TYPE = {
	ALL: 'toate',
	WORKSHOP: 'workshop',
	CONFERENCE: 'conferinta',
};

export default function WorkshopListClient({ initialWorkshops }: WorkshopListClientProps) {
	// registration controls handled at the parent/server; this client only shows details
	
	// --- State for our filters ---
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedType, setSelectedType] = useState(FILTER_TYPE.ALL);
	const [showAvailable, setShowAvailable] = useState(false);
	const [showMyRegistrations, setShowMyRegistrations] = useState(false);

	// --- Memoize the filtered list ---
	const filteredWorkshops = useMemo(() => {
		return initialWorkshops.filter(w => {
			const searchMatch = !searchTerm ||
				w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				w.instructor?.toLowerCase().includes(searchTerm.toLowerCase());

			const typeMatch = selectedType === FILTER_TYPE.ALL || w.wsType === selectedType;

			const availableMatch = !showAvailable || (w.maxParticipants - w.currentParticipants) > 0;

			const registrationMatch = !showMyRegistrations || w.isRegistered;

			return searchMatch && typeMatch && availableMatch && registrationMatch;
		});
	}, [initialWorkshops, searchTerm, selectedType, showAvailable, showMyRegistrations]);


	// --- Helper styles for filter buttons ---
	const activeBtnClass = "bg-primary text-primary-foreground";
	const inactiveBtnClass = "bg-secondary text-secondary-foreground hover:bg-secondary/80";

	return (
		<>
			{/* --- FILTER UI --- */}
			<Card className="mb-8 p-6 space-y-4">
				{/* Search Bar */}
				<div className="relative">
					<input
						type="text"
						placeholder="Caută după titlu sau instructor..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						className="mimesiss-input !pl-10 w-full" // Assuming you have a global input style
					/>
					<FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				</div>

				{/* Type Buttons */}
				<div className="flex flex-wrap gap-2">
					<button
						type='button'
						onClick={() => setSelectedType(FILTER_TYPE.ALL)}
						className={`px-4 py-2 rounded-md text-sm font-medium ${selectedType === FILTER_TYPE.ALL ? activeBtnClass : inactiveBtnClass}`}
					>
						Toate
					</button>
					<button
						type='button'
						onClick={() => setSelectedType(FILTER_TYPE.WORKSHOP)}
						className={`px-4 py-2 rounded-md text-sm font-medium ${selectedType === FILTER_TYPE.WORKSHOP ? activeBtnClass : inactiveBtnClass}`}
					>
						Workshops
					</button>
					<button
						type='button'
						onClick={() => setSelectedType(FILTER_TYPE.CONFERENCE)}
						className={`px-4 py-2 rounded-md text-sm font-medium ${selectedType === FILTER_TYPE.CONFERENCE ? activeBtnClass : inactiveBtnClass}`}
					>
						Conferințe
					</button>
				</div>

				{/* Checkboxes */}
				<div className="flex flex-col sm:flex-row sm:gap-6 space-y-2 sm:space-y-0">
					<label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
						<input
							type="checkbox"
							className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							checked={showAvailable}
							onChange={e => setShowAvailable(e.target.checked)}
						/>
						Afișează doar locuri disponibile
					</label>
					<label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
						<input
							type="checkbox"
							className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							checked={showMyRegistrations}
							onChange={e => setShowMyRegistrations(e.target.checked)}
						/>
						Doar înscrierile mele
					</label>
				</div>
			</Card>

			{/* --- WORKSHOP LIST --- */}
			{filteredWorkshops.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground text-lg">
						Niciun workshop nu corespunde filtrelor selectate.
					</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredWorkshops.map((workshop) => (
						<Card key={workshop._id?.toString()} className="p-6 flex flex-col justify-between">
							{/* This is the same mapping logic from your original file */}
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{workshop.title}
							</h3>
							<div className='my-2'>
								<span className="pill">{workshop.wsType === 'workshop' ? 'Workshop' : 'Conferință'}</span>
							</div>

							<div className="space-y-3">
								{workshop.date && (
									<div className="flex items-center text-sm text-muted-foreground">
										<FaCalendarAlt className="h-4 w-4 mr-2" />
										{new Date(workshop.date).toLocaleDateString('ro-RO', {
											weekday: 'long',
											year: 'numeric',
											month: 'long',
											day: 'numeric',
										})}
									</div>
								)}
								{workshop.time && (
									<div className="flex items-center text-sm text-muted-foreground">
										<FaClock className="h-4 w-4 mr-2" />
										{workshop.time || 'Ora va fi anunțată'}
									</div>
								)}
								{workshop.location && (
									<div className="flex items-center text-sm text-muted-foreground">
										<FaMapMarkerAlt className="h-4 w-4 mr-2" />
										{workshop.location}
									</div>
								)}
								<div className="flex items-center text-sm text-muted-foreground">
									<FaUsers className="h-4 w-4 mr-2" />
									{workshop.wsType === 'conferinta' ? (
										<>
											{workshop.currentParticipants || 0} {workshop.currentParticipants === 1 ? 'participant' : 'participanți'}
										</>
									) : (
										workshop.currentParticipants === 0 ? `Niciun participant din ${workshop.maxParticipants}` : (
											<>
												{(workshop.currentParticipants || 0)} / {workshop.maxParticipants || 0} participanți
											</>
										)
									)}
								</div>
							</div>

							<div className="mt-4 pt-4 border-t border-border">
								{workshop.instructor && (
									<p className="text-sm text-muted-foreground mb-3">
										Instructor: <span className="font-medium text-foreground">{workshop.instructor}</span>
									</p>
								)}
								{workshop.currentParticipants !== 0 && workshop.wsType !== 'conferinta' && (
									<div className="flex items-center justify-between my-2">
										<div className="flex-1">
											<div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-primary h-2 rounded-full transition-all duration-300"
													style={{
														width: `${Math.min(100, Math.max(0, ((workshop.currentParticipants || 0) / (workshop.maxParticipants || 1)) * 100))}%`,
													}}
												></div>
											</div>
										</div>
										<span className="ml-3 text-xs text-muted-foreground">
											{Math.round(((workshop.currentParticipants || 0) / (workshop.maxParticipants || 1)) * 100)}% complet
										</span>
									</div>
								)}
							</div>
							{/* Registration button removed on list page - only details link shown */}
							<div className="mt-6">
								<Link
									href={`/workshops/${workshop._id || workshop.id || ''}`}
									className="w-full block text-center bg-secondary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-md transition duration-200"
								>
									Vezi detalii
								</Link>
							</div>
						</Card>
					))}
				</div>
			)}
		</>
	);
}
import { getWorkshopById } from "../actions";
import HeaderContent from "@/components/ui/HeaderContent";
import { WorkshopRegistrationButton } from "@/components/WorkshopRegistrationButton";
import type { Workshop } from "@/types/models";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaChalkboardTeacher, FaUsers, FaInfoCircle, FaInstagram } from 'react-icons/fa';
import { getIsRegisteredForWorkshop } from "../actions";
import { Metadata } from 'next';
import { InstagramPost } from "@/components/InstagramPost";

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const workshop = await getWorkshopById(id) as Workshop | null;

	if (!workshop) {
		return {
			title: 'Workshop negăsit - MIMESISS 2025',
			description: 'Workshop-ul căutat nu există.',
		};
	}

	const wType = workshop.wsType === 'workshop' ? 'Workshop' :
		workshop.wsType === 'conferinta' ? 'Conferință' : workshop.wsType;

	const formatDate = (value?: Date | string) => {
		if (!value) return "";
		const d = value instanceof Date ? value : new Date(value);
		return new Intl.DateTimeFormat('ro-RO', { dateStyle: "long" }).format(d);
	};

	const isConference = workshop.wsType === 'conferinta';
	const availableSpots = isConference ? 'nelimitate' : (workshop.maxParticipants - workshop.currentParticipants).toString();
	const workshopDate = workshop.date ? formatDate(workshop.date) : "Data va fi anunțată";

	return {
		title: `${workshop.title} - ${wType} MIMESISS 2025`,
		description: `${workshop.description} | ${workshopDate} | ${isConference ? 'Locuri nelimitate' : `${availableSpots} locuri disponibile`} | Instructor: ${workshop.instructor || 'Va fi anunțat'}`,
		keywords: [
			'MIMESISS 2025',
			'congres medical',
			'workshop medical',
			workshop.title,
			workshop.wsType,
			'student medicină',
			'București',
			'conferință medicală',
		],
		robots: {
			index: true,
			follow: true,
		},
	};
}

function formatDate(value?: Date | string) {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat('ro-RO', { dateStyle: "long" }).format(d);
}

function formatDateTime(value?: Date | string) {
	if (!value) return "—";
	const d = value instanceof Date ? value : new Date(value);
	return new Intl.DateTimeFormat('ro-RO', {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(d);
}

export default async function WorkshopPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const workshop = (await getWorkshopById(id)) as Workshop | null;

	if (!workshop) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="mimesiss-card p-8 text-center">
					<FaInfoCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
					<h1 className="text-2xl font-bold text-foreground mb-2">Workshop negăsit</h1>
					<p className="text-muted-foreground">Workshop-ul căutat nu există sau a fost șters.</p>
				</div>
			</div>
		);
	}

	// Serialize the workshop data for client components
	const wsJSON = JSON.parse(JSON.stringify(workshop));

	const isRegistered = workshop ? await getIsRegisteredForWorkshop(workshop._id?.toString() ?? '') : false;

	const workshopDate = workshop.date ? new Date(workshop.date) : undefined;
	const isConference = workshop.wsType === 'conferinta';
	const availableSpots = isConference ? Infinity : workshop.maxParticipants - workshop.currentParticipants;
	const isWorkshopFull = !isConference && availableSpots <= 0;

	const wType = workshop.wsType === 'workshop' ? 'Workshop' :
		workshop.wsType === 'conferinta' ? 'Conferință' : workshop.wsType;

	return (
		<>
			<HeaderContent title={`${wType}: ${workshop.title}`} />
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
					{/* Hero Section */}
					<div className="mimesiss-card p-8">
						<div className="text-center mb-6">
							<h1 className="text-3xl font-bold text-foreground mb-3">{workshop.title}</h1>
							<p className="text-lg text-muted-foreground leading-relaxed">{workshop.description}</p>
						</div>

						{/* Registration Button */}
						<div className="flex justify-center mb-6">
							<WorkshopRegistrationButton
								workshop={wsJSON}
								isRegistered={isRegistered}
							/>
						</div>					{/* Status Badge */}
						<div className="flex justify-center">
							<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${workshop.status === 'active' ? 'bg-primary/10 text-primary border border-primary/20' :
								workshop.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
									'bg-red-100 text-red-800 border border-red-200'
								}`}>
								{workshop.status === 'active' ? 'Activ' :
									workshop.status === 'completed' ? 'Finalizat' :
										workshop.status === 'cancelled' ? 'Anulat' : workshop.status}
							</span>
						</div>
					</div>


					{/* Instagram embed */}
					{workshop.url && (
						<div className="mimesiss-card p-6">
							<h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
								<FaInstagram className="mr-2 text-primary" />
								Postare Instagram
							</h2>

							{/* Instagram embed */}
							<div className="flex justify-center">
								<InstagramPost url={workshop.url || ''} />
							</div>
						</div>
					)}


					{/* Workshop Details */}
					<div className="mimesiss-card p-6">
						<h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
							<FaInfoCircle className="mr-2 text-primary" />
							Detalii Workshop
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="flex items-center p-4 bg-muted/30 rounded-lg">
								<FaCalendarAlt className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-1">Data</h4>
									<div className="font-semibold text-foreground">{formatDate(workshopDate)}</div>
								</div>
							</div>

							<div className="flex items-center p-4 bg-muted/30 rounded-lg">
								<FaClock className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-1">Ora</h4>
									<div className="font-semibold text-foreground">{workshop.time || "De stabilit"}</div>
								</div>
							</div>

							<div className="flex items-center p-4 bg-muted/30 rounded-lg">
								<FaMapMarkerAlt className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-1">Locația</h4>
									<div className="font-semibold text-foreground">{workshop.location || "De stabilit"}</div>
								</div>
							</div>

							<div className="flex items-center p-4 bg-muted/30 rounded-lg">
								<FaChalkboardTeacher className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
								<div>
									<h4 className="text-sm font-medium text-muted-foreground mb-1">Instructor</h4>
									<div className="font-semibold text-foreground">{workshop.instructor || "De stabilit"}</div>
								</div>
							</div>
						</div>
					</div>

					{/* Maps Embed */}
					{workshop.location && (
						<div className="mimesiss-card p-6">
							<h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
								<FaMapMarkerAlt className="mr-2 text-primary" />
								Locația Workshop-ului
							</h2>
							<div className="h-[400px]">
								<iframe
									src={`https://maps.google.com/maps?q=${encodeURIComponent(workshop.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
									width="100%"
									height="100%"
									className="rounded-lg border-0"
									loading="lazy"
									referrerPolicy="no-referrer-when-downgrade"
									title="Harta Locației Workshop-ului"
								></iframe>
							</div>
						</div>
					)}

					{/* Participation Info */}
					<div className="mimesiss-card p-6">
						<h2 className="text-xl font-semibold text-foreground mb-6 flex items-center">
							<FaUsers className="mr-2 text-primary" />
							Informații Participare
						</h2>

						{isConference ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
									<div className="text-2xl font-bold text-primary mb-1">∞</div>
									<div className="text-sm text-muted-foreground">Locuri nelimitate</div>
								</div>

								<div className="text-center p-4 bg-muted/30 rounded-lg">
									<div className="text-2xl font-bold text-foreground mb-1">{workshop.currentParticipants}</div>
									<div className="text-sm text-muted-foreground">Participanți înscriși</div>
								</div>
							</div>
						) : (
							<>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/10">
										<div className="text-2xl font-bold text-primary mb-1">{workshop.maxParticipants}</div>
										<div className="text-sm text-muted-foreground">Locuri disponibile</div>
									</div>

									<div className="text-center p-4 bg-muted/30 rounded-lg">
										<div className="text-2xl font-bold text-foreground mb-1">{workshop.currentParticipants}</div>
										<div className="text-sm text-muted-foreground">Participanți înscriși</div>
									</div>

									<div className="text-center p-4 bg-muted/30 rounded-lg">
										<div className={`text-2xl font-bold mb-1 ${isWorkshopFull ? 'text-destructive' : 'text-green-600'}`}>
											{availableSpots}
										</div>
										<div className="text-sm text-muted-foreground">Locuri rămase</div>
									</div>
								</div>

								{isWorkshopFull && (
									<div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
										<p className="text-sm text-destructive text-center font-medium">
											⚠️ Workshop-ul este complet rezervat
										</p>
									</div>
								)}
							</>
						)}
					</div>

					{/* Type and Additional Info */}
					{(workshop.wsType || workshop.createdAt) && (
						<div className="mimesiss-card p-6">
							<h2 className="text-xl font-semibold text-foreground mb-6">Informații Suplimentare</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{workshop.wsType && (
									<div>
										<h4 className="text-sm font-medium text-muted-foreground mb-2">Tip Eveniment</h4>
										<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
											{workshop.wsType === 'workshop' ? 'Workshop' :
												workshop.wsType === 'conferinta' ? 'Conferință' : workshop.wsType}
										</span>
									</div>
								)}

								{workshop.createdAt && (
									<div>
										<h4 className="text-sm font-medium text-muted-foreground mb-2">Creat la</h4>
										<div className="text-foreground">{formatDateTime(workshop.createdAt)}</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
		</>
	);
}

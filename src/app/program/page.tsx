import HeaderContent from "@/components/ui/HeaderContent";
import Link from "next/link";


const timelineData = [
	{
		date: 'VINERI 14.11',
		title: 'Ziua 1',
		conferenceLocation: 'Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"',
		conferences: [
			{ time: '8:30 - 9:15', speaker: 'GL. BG. (REZ) CONF. UNIV. DR. MARIAN BURCEA MEDIC PRIMAR OFTALMOLOGIE', title: 'Terapiile laser în oftalmologie - modernism și precizie în tratarea afecțiunilor oftalmologice' },
			{ time: '9:15 - 9:30', break: 'Coffee break' },
			{ time: '9:30 - 10:15', speaker: 'COL. MEDIC ȘEF LUCRĂRI DR. MUNTEANU ALICE ELENA', title: 'Hipertensiunea arterială: Provocări actuale și abordări inovatoare' },
			{ time: '10:15 - 10:30', break: 'Coffee break' },
			{
				time: '10:30 - 11:30', speaker: 'DR. CONSTANTINESCU CRISTINA-LILIANA MEDIC SPECIALIST OBSTETICĂ GINECOLOGIE', title: 'De la diagnosticul de infertilitate până la naștere'
			},
		],
		workshops: [
			{ time: '10:00 - 13:00', instructor: 'ASIST. UNIV. DR. SILVIA PREDA MEDIC SPECIALIST CHIRURGIE CARDIOVASCULARĂ', title: 'Arta din spatele reparațiilor valvulare', location: 'Institutul Medico-Militar București' },
			{ time: '12:00 - 14:00', instructor: 'COL. MED. DR. ADINA MAZILU MEDIC PRIMAR ENDOCRINOLOGIE', title: 'Explorarea tiroidei prin ecografie: De la teorie la practică', location: 'Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
			{ time: '12:00 - 16:00', instructor: 'SSCR', title: 'Mini Knots & Sutures', location: 'Institutul Medico-Militar București' },
			{ time: '14:00 - 16:00', instructor: 'DR. ROBERT MARIAȘI', title: 'Decoding the X-Ray', location: 'Secția clinică neurologie - Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
			{ time: '14:00 - 17:00', instructor: 'DR. MARA REBOȘAPCĂ', title: 'Septoplastia pas cu pas', location: 'Institutul Medico-Militar București' },
			{ time: '15:00 - 17:00', instructor: 'LT. MED. DR. MIHAI SĂNDULESCU', title: 'Antrenament în necunoscut: barocamera și iluzia orientării', location: 'Institutul Național de Medicină Aeronautică și Spațială "General Doctor Aviator Victor Atanasiu"' },
			{ time: '15:00 - 18:00', instructor: 'ASIST. UNIV. DR. RADU PARASCHIV', title: 'Abord minim invaziv în chirurgia articulară: artroscopia', location: 'CIEH' },
			{ time: '16:00 - 18:00', instructor: 'ȘEF LUCRĂRI DR. SELDA ALI', title: 'Aerul pe care îl respirăm, alergiile pe care le descoperim', location: 'Spitalul Clinic de Nefrologie Doctor Carol Davila' },
			{ time: '16:00 - 20:00', instructor: 'SSCR', title: 'Mini Skills in Plastic Surgery', location: 'Institutul Medico-Militar București' },
			{ time: '17:00 - 19:00', instructor: 'LT. MED. DR. GABRIEL ILINOIU', title: 'PET/CT: Cum vedem ceea ce nu se vede?', location: 'Secția clinică neurologie - Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
		]
	},
	{
		date: 'SAMBATA 15.11',
		title: 'Ziua 2',
		conferenceLocation: 'Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"',
		conferences: [
			{ time: '8:30 - 9:15', speaker: 'DR. BLĂNARU TEODOR Specialist Chirurgie Generală', title: 'Gastric Sleeve - succes terapeutic sau risc chirurgical?' },
			{ time: '9:15 - 9:30', break: 'Coffee break' },
			{ time: '9:30 - 10:15', speaker: 'DR. DIANA CHIȚIMUȘ Specialist Neurolog', title: 'Terapiile genice în neurologia modernă: cum definim o boală rară?' },
			{ time: '10:15 - 10:30', break: 'Coffee break' },
			{ time: '10:30 - 11:30', speaker: 'DR. FELIX DOBRIȚOIU Medic Specialist Chirurgie Generală', title: 'Când roboții țin bisturiul' },
		],
		workshops: [
			{ time: '12:00 - 14:00', instructor: 'Lt. Med Dr. Aida Manole', title: 'Simularea crizei epileptice și intervenția corectă a echipei medicale', location: 'Secția clinică neurologie - Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
			{ time: '12:00 - 16:00', instructor: 'SSCR', title: 'Mini Skills in Bowel Surgery', location: 'Institutul Medico-Militar București' },
			{ time: '12:30 - 15:30', instructor: 'Dr. Cătălin Dudu', title: 'Colecistectomia deschisă: repere anatomice și controlul complicațiilor', location: 'Institutul Medico-Militar București' },
			{ time: '13:00 - 15:00', instructor: 'Conf. Univ. Dr. Tatiana Ciomârtan', title: 'Suport vital pediatric de bază', location: 'Institutul Național pentru Sănătatea Mamei și Copilului „Alessandrescu-Rusescu"' },
			{ time: '14:00 - 16:00', instructor: 'Lt. Col. Med. Dr. Vladimir Zahiu Medic Specialist ATI', title: 'Asigurarea căii aeriene - o manevră cu potențial salvator de viață', location: 'Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
			{ time: '14:00 - 16:00', instructor: 'Conf. Univ. Habil. Dr. Simona Trifu', title: 'În labirintul minții: Explorarea schizofreniei prin istoric clinic', location: 'Spitalul Clinic de Psihiatrie "Al Obregia"' },
			{ time: '14:00 - 17:00', instructor: 'Asist. Univ. Dr. Amza Andrei', title: 'De la calculi la bisturiu: Abilități practice în urologie', location: 'Sala biochimie - Universitatea de Medicină și Farmacie „Carol Davila" din București' },
			{ time: '12:00 - 15:00', instructor: 'Conf. Univ. Dr. Vasile Balaban', title: 'Împingând limitele - Viitorul intervențiilor endoscopice', location: 'CIEH' },
			{ time: '14:00 - 17:00', instructor: 'Lt. Med. Dr. Camelia Precop', title: 'Primii pași în Trauma Ortopedică - Managementul fracturilor', location: 'Sala biochimie - Universitatea de Medicină și Farmacie „Carol Davila" din București' },
			{ time: '14:00 - 17:00', instructor: 'Asist. Univ. Dr. Alexandru Șerbănoiu', title: 'Radiologia Intervențională - de la Teorie la Practică', location: 'Secția clinică neurologie - Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
			{ time: '15:00 - 17:00', instructor: 'Asist. Univ. Drd. Ruxandra Țurlea', title: 'Rolul medicului legist și utilitatea expertizei medico-legale în justiție', location: 'Institutul Național de Medicină Aeronautică și Spațială "General Doctor Aviator Victor Atanasiu"' },
			{ time: '16:00 - 20:00', instructor: 'Col. Med. Prof. Univ. Habil. Dr. Claudiu Nistor Eduard', title: 'Chirurgia toracică: fundamente și aplicații practice', location: 'Institutul Medico-Militar București' },
			{ time: '16:00 - 20:00', instructor: 'SSCR', title: 'Mini Skills in Vascular Surgery', location: 'Institutul Medico-Militar București' },
			{ time: '17:00 - 19:00', instructor: 'Asist. Univ. Dr. Paul Portelli', title: 'Respirație cu respirație - Înțelegerea funcției pulmonare', location: 'Secția clinică neurologie - Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"' },
		]
	},
	{
		date: 'DUMINICA 16.11',
		title: 'Ziua 3',
		conferenceLocation: 'Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila"',
		conferences: [
			{ time: '9:00 - 9:45', speaker: 'DR. TUDOR IONESCU', title: 'Fascinanta clinică și chirurgie a vocii' },
			{ time: '9:45 - 10:00', break: 'Coffee break' },
			{ time: '11:00 - 11:45', speaker: 'DR. MIHAI OPREA', title: 'Abilitățile non-tehnice — un atu sau o necesitate pentru un medic?' },
			{ time: '10:45 - 11:00', break: 'Coffee break' },
			{ time: '10:00 - 10:45', speaker: 'DR. PAUL OARGĂ', title: 'De la sala de operație la lumea online: De ce ar trebui medicii să îmbrățișeze rețelele sociale?' },
			{ time: '11:45 - 12:00', break: 'Coffee break' },
			{ time: '12:00 - 12:45', speaker: 'GL. BG. MED. ASIST. UNIV. DR. OANCEA FLORIN', title: 'Pandemia - managementul crizei și lecții învățate' },
			{ time: '12:45 - 13:00', break: 'Coffee break' },
			{ time: '13:00 - 13:45', speaker: 'LT. COL. MED. DR. ȚILEA ANTON', title: 'Cui îi e frică de tumorile pigmentare cutanate?' },
			{ time: '13:45 - 14:00', break: 'Coffee break' },
		],
		workshops: [
			{ time: '14:00 - 19:00', instructor: 'Echipa MIMESISS', title: 'Sesiunea de Prezentări Științifice a Studenților', location: '' },
		]
	},
]; export default async function ProgramPage() {
	return (
		<>
			<HeaderContent title="Program MIMESISS 2025" />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

				<div className="mimesiss-card mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 text-center flex flex-col items-center justify-center p-8 space-y-4">

					<h2 className="text-2xl font-bold text-primary text-center">JOI - 13 Noiembrie</h2>

					<p className="text-lg font-semibold text-foreground">Ceremonia de deschidere a congresului MIMESISS 2025</p>

					<Link
						href="https://www.google.com/maps/search/Cercul+Militar+Na%C8%9Bional"
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline font-medium"
					>
						Cercul Militar Național
					</Link>

					<p>
						Intervalul orar: 18:00 - 21:00
					</p>

					<a className="mimesiss-btn-primary max-w-80 my-5 mx-auto" href="/docs/Program.pdf">Descarca Programul PDF</a>

				</div>

				{/* Timeline Container */}
				<div className="space-y-16">
					{timelineData.map((day, dayIndex) => (
						<div key={day.date} className="relative">
							{/* Day Header */}
							<div className="mb-8">
								<div className="flex items-center gap-4 mb-4">
									<div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
										{dayIndex + 1}
									</div>
									<div>
										<h2 className="text-3xl font-bold text-primary">{day.date}</h2>
										<p className="text-xl text-muted-foreground">{day.title}</p>
									</div>
								</div>
							</div>

							<div className="ml-0 md:ml-6 md:border-l-4 border-primary/30 md:pl-8 space-y-8">
								{/* Conferences */}
								<div>
									<h3 className="text-2xl font-semibold mb-3 text-foreground flex items-center gap-2">
										<span className="w-3 h-3 rounded-full bg-primary"></span>
										Conferințe
									</h3>
									<p className="text-sm text-muted-foreground mb-6 ml-0 md:ml-5">
										📍 Locație: <a href={`https://www.google.com/maps/search/${encodeURIComponent(day.conferenceLocation)}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{day.conferenceLocation}</a>
									</p>

									{/* Conference Timeline */}
									<div className="ml-0 md:ml-5 space-y-0">
										{day.conferences.map((conf, confIndex) => (
											<div key={`${day.date}-conf-${confIndex}`} className="relative pl-0 md:pl-8 pb-4 md:border-l-2 border-primary/20">
												{/* Timeline Dot */}
												<div className={`absolute -left-[5px] top-2 w-3 h-3 rounded-full ${conf.break ? 'bg-muted-foreground/50 ring-2 ring-muted' : 'bg-primary ring-4 ring-primary/20'} hidden md:block`}></div>

												<div className={`p-4 rounded-lg ${conf.break ? 'bg-muted/30 italic' : 'bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all'}`}>
													<div className="mb-2">
														<span className="font-semibold text-primary text-sm">{conf.time}</span>
													</div>
													{conf.break ? (
														<p className="text-sm text-muted-foreground">{conf.break}</p>
													) : (
														<div>
															<p className="font-medium text-foreground mb-2">{conf.title}</p>
															<p className="text-sm text-muted-foreground">{conf.speaker}</p>
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Workshops */}
								<div>
									<h3 className="text-2xl font-semibold mb-6 text-foreground flex items-center gap-2">
										<span className="w-3 h-3 rounded-full bg-primary"></span>
										Workshops
									</h3>

									{/* Workshop Timeline */}
									<div className="ml-0 md:ml-5 space-y-0">
										{day.workshops.map((workshop, wsIndex) => {
											return (
												<div key={`${day.date}-ws-${wsIndex}`} className="relative pl-0 md:pl-8 pb-4 md:border-l-2 border-primary/20">
													{/* Timeline Dot */}
													<div className="absolute -left-[5px] top-2 w-3 h-3 rounded-full bg-primary ring-4 ring-primary/20 hidden md:block"></div>

													<div className="p-4 bg-primary/5 border border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all">
														<div className="mb-2">
															<span className="font-semibold text-primary text-sm">{workshop.time}</span>
														</div>
														{workshop.title && (
															<p className="font-medium text-foreground mb-2">{workshop.title}</p>
														)}
														<p className="text-sm text-muted-foreground mb-3">{workshop.instructor}</p>
														{workshop.location && (
															<a
																href={`https://www.google.com/maps/search/${encodeURIComponent(workshop.location)}`}
																target="_blank"
																rel="noopener noreferrer"
																className="flex items-center gap-2 text-xs text-primary hover:underline font-medium"
															>
																<span>📍</span>
																<span>{workshop.location}</span>
															</a>
														)}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
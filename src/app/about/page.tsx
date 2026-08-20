import HeaderContent from "@/components/ui/HeaderContent";
import PersonCard from "@/components/ui/PersonCard";

type Person = {
	name: string;
	role: string;
	imageUrl: string;
	className?: string;
};

const peopleData: { row: Person[] }[] = [
	{
		row: [
			{ name: "Sd. Plt. Adj. Anghel Liviu-Florin", role: "Presedinte", imageUrl: "/pics/anghel.jpeg" },
			{ name: "Sd. Sg. Maj. Stancu Ștefania-Ionela", role: "Secretar General", imageUrl: "/pics/stancu.jpeg" },
		],
	},
	{
		row: [
			{ name: "Sd. Plt. Ursan Beatrice Ioana", role: "Vicepreședinte Interne", imageUrl: "/pics/ursan.jpeg", className: "col-span-2 w-1/2 mx-auto" },
		],
	},
	{
		row: [
			{ name: "Sd. Sg. Boșcă Mihai-Iulian", role: "Vicepreședinte Externe", imageUrl: "/pics/bosca.jpeg" },
			{ name: "Sd. Sg. Bănici Alexandru", role: "Vicepreședinte Științific", imageUrl: "/pics/banici.jpeg" },
		],
	},
	{
		row: [
			{ name: "Slt. Răducan Alexandra", role: "Coresponsabil Media", imageUrl: "/pics/raducan.jpeg" },
			{ name: "Sd. Sg. Geară Codruța Andreea", role: "Coresponsabil Media", imageUrl: "/pics/geara.jpeg" },
		],
	},
	{
		row: [
			{ name: "Slt. Peptănaru Daria Gabriela", role: "Coresponsabil Public Relations", imageUrl: "/pics/peptanaru.jpeg" },
			{ name: "Sd. Sg. Lascu Maria-Alina-Cerasela", role: "Coresponsabil Public Relations", imageUrl: "/pics/lascu.jpeg" },
		],
	},
	{
		row: [
			{ name: "Sd. Sg. Maj. Codreanu Radu Andrei", role: "Coresponsabil logistică", imageUrl: "/pics/codreanu.jpeg" },
			{ name: "Sd. Sg. Popescu Radu-George", role: "Coresponsabil logistică", imageUrl: "/pics/popescu.jpeg" },
		],
	},
	{
		row: [
			{ name: "Sd. Plt. Dobrin Costin", role: "Responsabil HR", imageUrl: "/pics/dobrin.jpeg" },
			{ name: "Sd. Cap. Oncel Mara-Elena", role: "Responsabil fundraising", imageUrl: "/pics/oncel.jpeg" },
		],
	},
	{
		row: [
			{ name: "Sd. Plt. Mocanu Mioara", role: "Responsabil conferințe", imageUrl: "/pics/mocanu.jpeg" },
			{ name: "Sd. Sg. Luca Vlad Mario", role: "Responsabil workshops", imageUrl: "/pics/luca.jpeg" },
		],
	},
];

export default function AboutPage() {
	return (
		<>
			<HeaderContent title="Comitetul de organizare" />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

				<h3 className="mimesiss-subtitle">Consiliu director</h3>

				<div className="grid grid-cols-2 gap-4 py-4 max-w-4xl mx-auto">
					{peopleData.slice(0, 3).map((group) => (
						group.row.map((person) => (
							<PersonCard key={person.name} name={person.name} role={person.role} imageUrl={person.imageUrl} className={person.className ? person.className : ''} />
						))
					))}
				</div>

				<h3 className="mimesiss-subtitle">Consiliu director extins</h3>

				<div className="grid grid-cols-2 gap-4 py-4 max-w-4xl mx-auto">
					{peopleData.slice(3).map((group) => (
						group.row.map((person) => (
							<PersonCard key={person.name} name={person.name} role={person.role} imageUrl={person.imageUrl} className={person.className ? person.className : ''} />
						))
					))}
				</div>
			</div>
		</>
	);
}

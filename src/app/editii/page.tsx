import HeaderContent from "@/components/ui/HeaderContent";
import Image from "next/image";

export default function EditiiPage() {
	return (
		<>
			<HeaderContent title='Ce este MIMESISS 2025 & Ediții anterioare' />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
				<ul className="list-none flex flex-col gap-4">
					<li>
						MIMESISS 2025 înseamnă o experiență unică: de la conferințe ce deschid noi orizonturi ale cunoașterii, până la workshop-uri interactive și educative, concepute să dezvolte și să consolideze abilitățile practice.
					</li>

					<li>
						Am preluat acest proiect pe când era doar o idee. De-a lungul anilor, cu ajutorul echipei noastre, al celor care ne-au susținut inițiativele și al participanților, am reușit să formăm o adevărată comunitate. Iar povestea noastră continuă și în acest an.
					</li>

					<li>
						Ne pregătim pentru cea de-a V-a ediție a congresului, păstrând același nivel ridicat de profesionalism care ne-a caracterizat până acum. Ediția de anul trecut a fost un real succes, reușind să combine utilul cu plăcutul și să trezească interesul participanților printr-o gamă variată de subiecte. Workshop-urile au abordat teme diverse - de la principiile de bază ale ecografiei abdominale, până la BLS & ALS sau knots and sutures - și acestea sunt doar câteva dintre numeroasele activități oferite anul trecut.
						Pentru ediția de anul acesta, pregătim experiențe și mai captivante, cu scopul de a ne depăși constant și de a oferi participanților oportunități de învățare și dezvoltare la cel mai înalt nivel.
					</li>
				</ul>
				<div className="grid grid-cols-3 gap-4">
					<Image src="/old/1.jpeg" alt="Description 3" width={500} height={300} className="object-cover" />
					<Image src="/old/4.jpeg" alt="Description 4" width={500} height={300} className="object-cover" />
					<Image src="/old/5.jpeg" alt="Description 5" width={500} height={300} className="object-cover" />
					<Image src="/old/7.jpeg" alt="Description 6" width={500} height={300} className="object-cover" />
					<Image src="/old/8.jpeg" alt="Description 7" width={500} height={300} className="object-cover" />
					<Image src="/old/9.jpeg" alt="Description 8" width={500} height={300} className="object-cover" />
					<Image src="/old/10.jpeg" alt="Description 9" width={500} height={300} className="object-cover" />
					<Image src="/old/11.jpeg" alt="Description 10" width={500} height={300} className="object-cover" />
					<Image src="/old/12.jpeg" alt="Description 11" width={500} height={300} className="object-cover" />
					<Image src="/old/6.jpeg" alt="Description 12" width={1203} height={808} className="object-cover col-span-3" />
				</div>
			</div>
		</>
	);
}
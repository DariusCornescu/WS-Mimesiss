import HeaderContent from "@/components/ui/HeaderContent";


export default function GhidPage() {
	return (
		<>
			<HeaderContent title='Ghid de redactare pentru Congresul MIMESISS 2025' />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				
				{/* Section 1: Dispoziții generale */}
				<section className="mb-12">
					<h2 className="mimesiss-subtitle mb-6">1. Dispoziții generale</h2>
					<div className="flex flex-col gap-6">
						<div>
							<p className="mb-4">
								<strong>Participarea activă</strong> în cadrul congresului MIMESISS 2025 se adresează studenților care vor realiza o prezentare orală, însoțită de un suport vizual. Participanții activi vor redacta și vor trimite abstractul lucrării către Comisia de Evaluare a congresului MIMESISS, în perioada prestabilită. În urma evaluării abstractului, autorul lucrării va fi declarat <strong>ADMIS</strong> sau <strong>RESPINS</strong>. Fiecare prezentare orală va avea durata de 10 minute, 7 minute fiind alocate prezentării propriu-zise, iar 3 minute vor fi alocate unei sesiuni de întrebări din partea juriului, a publicului și/sau a moderatorului.
							</p>
						</div>
						<div>
							<p>
								<strong>Participarea în cadrul secțiunii de e-postere</strong> se adresează studenților care doresc să realizeze un poster în format digital. Posterele vor fi însoțite de un abstract, iar acestea vor fi trimise împreună spre verificare către Comisia de Evaluare a congresului. În urma evaluării abstractului, autorul lucrării va fi declarat <strong>ADMIS</strong> sau <strong>RESPINS</strong>. În cadrul acestei secțiuni nu se vor realiza și prezentări orale. Posterele vor fi proiectate în format digital în timpul desfășurării congresului.
							</p>
						</div>
					</div>
				</section>

				{/* Section 2: Ghid de redactare a abstractelor */}
				<section className="mb-12">
					<h2 className="mimesiss-subtitle mb-6">2. Ghid de redactare a abstractelor pentru sesiunea de prezentări orale din cadrul congresului studențesc MIMESISS 2025</h2>
					
					<h3 className="text-xl font-semibold mb-4">Tehnoredactare:</h3>
					<ul className="list-disc list-inside flex flex-col gap-4 mb-6">
						<li>
							<strong>Titlul lucrării:</strong> Times New Roman, 12, Bold, centrat
						</li>
						<li>
							<strong>Autor și coordonator științific:</strong> Times New Roman, 12, aliniere spre dreapta.<br/>
							Se vor trece numele și prenumele autorului, respectiv numele și prenumele coordonatorului științific.
						</li>
						<li>
							<strong>Afilieri:</strong> Times New Roman, 10, italic, aliniere spre dreapta.<br/>
							Se va adăuga numărul afilierii cu superscript, iar pe rândul următor vor fi numerotate afilierile instituționale.<br/>
							<span className="italic">Ex: Popescu Ionel<sup>1</sup>, Ionescu Tudor<sup>2</sup></span><br/>
							<span className="italic">1. Institutul Medico-Militar București, 2. Universitatea de Medicină și Farmacie &quot;Carol Davila&quot; București</span>
						</li>
						<li>
							<strong>Keywords:</strong> Times New Roman, 12, aliniere la dreapta, titlul secțiunii de Keywords va fi scris cu bold.<br/>
							Se vor alege cinci cuvinte cheie care să prezinte esența temei alese.
						</li>
						<li>
							<strong>Body text:</strong> Times New Roman, 12, aliniere justified, spațiere între rânduri 1.15.<br/>
							Numele secțiunilor va fi scris cu bold.<br/>
							Abstractul va cuprinde 5 secțiuni:
							<ul className="list-decimal list-inside ml-6 mt-2 space-y-2">
								<li><strong>Introducere</strong> – cuprinde o scurtă introducere în tematica aleasă</li>
								<li><strong>Obiective</strong> – cuprinde o scurtă descriere a motivației alegerii temei și a direcției de cercetare</li>
								<li><strong>Materiale și metode</strong> – în cadrul acestei secțiuni se vor menționa bazele de date utilizate, modalitatea de colectare a datelor analizate, numărul de studii incluse, criteriile de includere și excludere etc. sau în cazul prezentărilor de caz clinic, se va prezenta metodologia cazului</li>
								<li><strong>Rezultate</strong> – această secțiune va cuprinde un rezumat al rezultatelor obținute de studiu/lucrare</li>
								<li><strong>Concluzii</strong> – în această secțiune va fi rezumată teza studiului/prezentării de caz</li>
							</ul>
						</li>
					</ul>

					<div className="bg-primary/5 border-l-4 border-primary p-6 my-6 rounded">
						<p className="font-semibold mb-4">
							Atât participanții din cadrul sesiunii de prezentări orale, cât și participanții care doresc să se înscrie în cadrul secțiunii de e-postere au obligația de a redacta și de a trimite un abstract către Comisia de Evaluare a congresului MIMESISS.
						</p>
					</div>

					<div className="flex flex-col gap-4 mt-6">
						<p>Documentul va avea un maxim de <strong>300-350 de cuvinte</strong> (se cere încadrarea textului pe o singură pagină).</p>

						<p>
							Documentul va fi transmis în format Word (.doc) sau PDF (.pdf) începând cu data de <strong className="underline">02.11.2025</strong> până la data de <strong className="underline">08.11.2025</strong>, la adresa de e-mail{' '}
							<a className="underline text-primary hover:text-primary/80 transition-colors" href="mailto:secretariat@asmm-bucuresti.com">
								secretariat@asmm-bucuresti.com
							</a>
						</p>

						<p>
							Evaluarea abstractelor va avea loc în perioada <strong className="underline">02.11.2025 - 11.11.2025</strong>.
						</p>

						<p>
							Rezultatele evaluării vor fi transmise prin e-mail de la adresa{' '}
							<a className="underline text-primary hover:text-primary/80 transition-colors" href="mailto:secretariat@asmm-bucuresti.com">
								secretariat@asmm-bucuresti.com
							</a>
						</p>

						<p>
							Doar versiunea finală trimisă înainte de deadline va fi acceptată și <strong>nu vor mai putea fi aduse modificări ulterioare</strong> documentului.
						</p>
					</div>
				</section>

				{/* Section 3: Ghid pentru prezentări */}
				<section className="mb-12">
					<h2 className="mimesiss-subtitle mb-6">3. Ghid pentru realizarea prezentărilor/suportului vizual din cadrul sesiunii de prezentări orale al congresului MIMESISS 2025</h2>
					
					<ul className="list-disc list-inside flex flex-col gap-4">
						<li>
							Suportul vizual va fi realizat utilizând soft-uri de editare pentru slideshow (PowerPoint, Canva, Prezi etc.)
						</li>
						<li>
							Conținutul prezentării va avea între <strong>7 și 12 slide-uri</strong> (numărul poate varia în funcție de necesitățile autorului)
						</li>
						<li>
							Textul de pe slide trebuie să fie lizibil, cromatica slide-urilor trebuie să fie adecvată cititului
						</li>
						<li>
							Primul slide al prezentării va cuprinde numele și prenumele autorului, numele și prenumele coordonatorului științific și afilierile instituționale ale acestora
						</li>
						<li>
							Ultimul slide al prezentării va cuprinde toate sursele bibliografice utilizate pentru realizarea prezentării
						</li>
						<li>
							Pentru imaginile/tabelele neoriginale, preluate din alte surse, este necesară citarea sursei, inferior de fotografie sau în slide-ul dedicat bibliografiei
						</li>
					</ul>
				</section>

				{/* Section 4: Ghid pentru postere */}
				<section className="mb-12">
					<h2 className="mimesiss-subtitle mb-6">4. Ghid pentru realizarea posterelor științifice din cadrul Congresului MIMESISS 2025</h2>
					
					<h3 className="text-xl font-semibold mb-4">Tehnoredactare:</h3>
					<ul className="list-disc list-inside flex flex-col gap-4 mb-6">
						<li>
							<strong>Dimensiunea posterului:</strong> A0, cu dimensiunile 841 × 1189 mm / 33,1 × 46,8 inch
						</li>
						<li>
							<strong>Titlul:</strong> scurt, sugestiv, centrat, vizibil de la distanță, scris cu font mare (minim 60–70 pt)
						</li>
						<li>
							<strong>Afilieri:</strong> Se va adăuga numărul afilierii cu superscript, iar pe rândul următor vor fi numerotate afilierile instituționale.<br/>
							<span className="italic">Ex: Popescu Ionel<sup>1</sup>, Ionescu Tudor<sup>2</sup></span><br/>
							<span className="italic">1. Institutul Medico-Militar București, 2. Universitatea de Medicină și Farmacie &quot;Carol Davila&quot; București</span>
						</li>
						<li>
							<strong>Conținut:</strong> Textul posterului va cuprinde șase secțiuni: <strong>Introducere, Obiective, Materiale și Metode, Rezultate, Discuții, Concluzii</strong>, care vor prezenta rezultatele aferente studiului realizat. Se va urmări ca textul din fiecare secțiune să fie lizibil, cu o rezoluție potrivită (font de mărime 28 pt). Conținutul va evidenția relevanța practică în context medico-militar (ex: urgențe, traumatologie de luptă, medicină preventivă, epidemiologie, logistică medicală etc.). Informațiile prezentate trebuie să fie rezultatul cercetării proprii sau al unei analize documentate, cu citarea surselor.
						</li>
						<li>
							<strong>Bibliografie și citări:</strong> posterul va cuprinde o secțiune dedicată surselor bibliografice, unde se va menționa fiecare citare din text. Citările și redactarea bibliografiei se vor realiza cu stil Vancouver.
						</li>
					</ul>

					<div className="flex flex-col gap-4 mt-6">
						<p>
							Documentul va fi transmis în format PDF (.pdf) începând cu data de <strong className="underline">02.11.2025</strong> până la data de <strong className="underline">08.11.2025</strong>, la adresa de e-mail{' '}
							<a className="underline text-primary hover:text-primary/80 transition-colors" href="mailto:secretariat@asmm-bucuresti.com">
								secretariat@asmm-bucuresti.com
							</a>
						</p>

						<p>
							Evaluarea posterelor va avea loc în perioada <strong className="underline">02.11.2025 - 11.11.2025</strong>.
						</p>

						<p>
							Rezultatele evaluării vor fi transmise prin e-mail de la adresa{' '}
							<a className="underline text-primary hover:text-primary/80 transition-colors" href="mailto:secretariat@asmm-bucuresti.com">
								secretariat@asmm-bucuresti.com
							</a>
						</p>

						<p>
							Doar versiunea finală trimisă înainte de deadline va fi acceptată și <strong>nu vor mai putea fi aduse modificări ulterioare</strong> documentului.
						</p>

						<p className="font-semibold mt-4">
							Fiecare participant al sesiunii de e-postere va trimite împreună cu posterul și abstractul posterului, urmând indicațiile ghidului de redactare pentru abstracte.
						</p>

						<p className="italic">
							Secțiunea pentru e-postere presupune proiectarea posterului în format digital, fără prezentare orală susținută de autorul lucrării.
						</p>
					</div>
				</section>

			</div>
		</>
	);
}

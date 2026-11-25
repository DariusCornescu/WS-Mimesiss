import type { ProjectCard } from '@/lib/projects'
import type { UpcomingEvent } from '@/lib/events'

/**
 * PATH — Practical Abilities & Training in Healthcare.
 *
 * Tot conținutul proiectului stă aici, ca pagina, homepage-ul și meniul să
 * spună același lucru. Când asociația trimite workshopurile și medicii, se
 * completează doar `pathWorkshops`; restul paginii se adaptează singur.
 */

export const PATH_SLUG = 'path'
export const PATH_HREF = '/proiecte/path'
export const PATH_WORKSHOPS_HREF = `${PATH_HREF}/workshops`
export const PATH_REGISTRATION_HREF = `${PATH_HREF}/inscrieri`
export const PATH_COVER = '/projects/path/cover.webp'
/** Where a ticket holder picks their workshops, inside the account. */
export const PATH_CHOICE_HREF = '/dashboard/workshops'

export const pathProject = {
  title: 'PATH',
  tagline: 'Practical Abilities & Training in Healthcare',
  kicker: 'Proiect nou · Prima ediție',
  summary:
    'Două zile de workshopuri medicale interactive și provocări clinice, pentru studenții care vor să exerseze medicina aplicată.',
  /** Decembrie = ora României, UTC+2. Finalul este exclusiv (miezul nopții de după a doua zi). */
  startsAt: '2026-12-04T00:00:00+02:00',
  endsAt: '2026-12-06T00:00:00+02:00',
  dateLabel: '4–5 decembrie 2026',
  registrationOpensAt: '2026-11-17T00:00:00+02:00',
  registrationOpensLabel: '17 noiembrie',
  /** Înscrierea înseamnă cumpărarea biletului; workshopurile se aleg ulterior, din cont. */
  registrationHref: '/payment' as string | null,
} as const

export const pathStory = {
  lead: 'Un nou început prinde contur.',
  paragraphs: [
    'În perioada 4–5 decembrie are loc prima ediție PATH — un proiect dedicat studenților care vor să experimenteze medicina aplicată și să-și exerseze abilitățile practice în mod direct și interactiv.',
    'Născut din pasiunea pentru medicină și dorința de a încuraja învățarea prin experiență, PATH își propune să creeze un cadru în care teoria prinde viață, iar curiozitatea devine oportunitate de dezvoltare.',
    'Credem că formarea unui medic nu înseamnă doar acumularea de informații, ci și capacitatea de a le transforma în competențe, de a gândi critic și de a acționa cu încredere.',
  ],
  statement: 'Două zile. Experiențe noi. O perspectivă diferită asupra medicinei.',
  invitation: 'PATH începe aici. Vă invităm să fiți parte dintr-un proiect în care învățarea capătă o nouă dimensiune.',
}

/** Cui se adresează PATH, afișat lângă înscrieri până începe ediția. */
export const pathAudience = {
  title: 'PATH este un proiect destinat tuturor studenților interesați!',
  paragraphs: [
    'Porțile noastre sunt deschise pentru toți studenții curioși și dornici să se implice, din orice oraș al țării!',
    'Nu trebuie să fii la o academie militară — indiferent ce studiezi, locul tău poate fi aici.',
  ],
  /** Ora României. Până atunci se anunță data; după, rămâne doar îndemnul. */
  workshopChoiceOpensAt: '2026-11-30T00:00:00+02:00',
  workshopChoiceSoon: 'Din 30 noiembrie îți vei putea alege workshopurile preferate!',
  capacityNote: 'Asigură-ți locul din timp — fiecare workshop are capacitate limitată!',
} as const

export const pathHighlights = [
  {
    title: 'Workshopuri medicale interactive',
    text: 'Îți exersezi abilitățile practice în mod direct, alături de medici.',
  },
  {
    title: 'Provocări clinice',
    text: 'Situații menite să stimuleze gândirea critică și să consolideze cunoștințele.',
  },
  {
    title: 'O perspectivă reală',
    text: 'Vezi de aproape provocările profesiei medicale, dincolo de teorie.',
  },
]

export type PathWorkshop = {
  /**
   * Stable key linking this entry to its Workshop document (`pathSlug`), which
   * holds the seats, date, time and room. Never change one that is in use.
   */
  slug: string
  title: string
  /** Medicul care susține workshopul, cu titlul afișat întocmai. */
  doctor: string
  /** Specialitatea sau funcția, ex. „Medic primar chirurgie generală”. */
  doctorRole?: string
  /** Al doilea medic, când workshopul este susținut de doi. */
  secondDoctor?: { name: string; role?: string; image?: string; imageAlt?: string }
  description: string
  /** Cale locală din /public, ex. „/projects/path/workshops/sutura.webp”. */
  image?: string
  imageAlt?: string
  /** Text liber, ex. „Vineri, 4 decembrie · 10:00–12:00”. */
  schedule?: string
  location?: string
  seats?: number
}

/** Cât timp lista e goală, pagina afișează un anunț în locul ei. */
export const pathWorkshops: PathWorkshop[] = [
  {
    slug: 'adictii-la-tineri',
    title: 'Dincolo de consum: mecanisme psihologice și implicații psihiatrice ale adicțiilor la tineri',
    doctor: 'Drd. dr. Gabriel Zanfir',
    doctorRole: 'Medic rezident în psihiatrie',
    description: [
      'Drd. dr. Gabriel Zanfir este medic rezident în psihiatrie, doctorand în științe medicale la Universitatea de Medicină și Farmacie „Carol Davila”, psiholog clinician și psihoterapeut cu formare în terapia cognitiv-comportamentală.',
      'În activitatea sa, pune accent pe acuratețea diagnosticului clinic, evaluarea atentă a simptomatologiei și diagnosticul diferențial, integrând perspectiva psihiatrică și cea psihologică pentru a înțelege dificultățile în contextul de viață personal și a orienta intervențiile către nevoile individuale, pe baza dovezilor științifice.',
      'În cadrul acestui workshop, participanții vor explora alături de el factorii de vulnerabilitate și dinamicile emoționale care stau la baza comportamentelor adictive, dobândind repere clinice concrete pentru recunoașterea timpurie și intervenția eficientă.',
    ].join('\n\n'),
    image: '/projects/path/workshops/gabriel-zanfir.webp',
    imageAlt: 'Drd. dr. Gabriel Zanfir, medic rezident în psihiatrie.',
  },
  {
    slug: 'evaluarea-psihiatrica',
    title: 'Evaluarea psihiatrică și decizia medicală în medii operaționale cu risc ridicat',
    doctor: 'Dr. Blaj Carmen Ioana',
    doctorRole: 'Medic specialist în psihiatrie',
    description: [
      'Dr. Blaj Carmen Ioana este medic specialist în psihiatrie, cu preocupări în evaluarea și înțelegerea complexității tulburărilor psihice. Activitatea sa presupune o abordare atentă a fiecărui caz clinic, de la identificarea manifestărilor simptomatice și stabilirea diagnosticului, până la alegerea conduitei medicale adecvate.',
      'Prin perspectiva clinică asupra sănătății mintale, contribuie la aprofundarea înțelegerii proceselor de evaluare psihiatrică și a rolului acestora în fundamentarea deciziilor medicale.',
      'În cadrul acestui workshop, veți avea ocazia să descoperiți particularitățile evaluării psihiatrice prin analiza unor cazuri clinice. Pornind de la datele prezentate, veți fi provocați să formulați ipoteze diagnostice, să evaluați aptitudinea pentru activitate și să argumentați deciziile medicale, ținând cont de factorul uman și de siguranța operațională.',
    ].join('\n\n'),
    image: '/projects/path/workshops/carmen-ioana-blaj.webp',
    imageAlt: 'Dr. Blaj Carmen Ioana, medic specialist în psihiatrie.',
  },
  {
    slug: 'epilepsia-dincolo-de-convulsii',
    title: 'Epilepsia dincolo de convulsii: recunoaște criza, descoperă focarul',
    doctor: 'Lt. dr. Manole Aida Mihaela',
    doctorRole: 'Medic specialist în neurologie',
    description: [
      'Cum recunoaștem o criză epileptică? Poate o simplă privire fixă să reprezinte o criză? Ce ne pot spune mișcările unui pacient despre regiunea cerebrală implicată?',
      'Acest workshop interactiv îi invită pe studenți să descopere diversitatea manifestărilor epileptice și să înțeleagă modul în care observația clinică și electroencefalografia contribuie la stabilirea diagnosticului.',
      'Prin vizionarea unor înregistrări video, analiza traseelor EEG și rezolvarea unor cazuri clinice, participanții vor avea ocazia să recunoască principalele tipuri de crize epileptice, să identifice semne clinice sugestive pentru localizarea focarului epileptogen și să formuleze ipoteze diagnostice. Astfel, vor putea aborda cazurile clinice din perspectiva unui medic neurolog, dezvoltându-și abilitățile de observație și raționament clinic.',
    ].join('\n\n'),
    image: '/projects/path/workshops/aida-mihaela-manole.webp',
    imageAlt: 'Lt. dr. Manole Aida Mihaela, medic specialist în neurologie.',
  },
  {
    slug: 'inside-bariatric-surgery',
    title: 'Inside Bariatric Surgery: A Hands-On Experience',
    doctor: 'Dr. Ruxandra Marian',
    doctorRole: 'Medic specialist în chirurgie generală',
    description: [
      'Dr. Ruxandra Marian este medic specialist în chirurgie generală, cu supraspecializare în chirurgia bariatrică și o experiență profesională de peste 12 ani. În prezent, își desfășoară activitatea în cadrul Spitalului Nord Pipera, unde contribuie la îmbunătățirea stării de sănătate a pacienților, oferindu-le șansa unui nou început.',
      'Parcursul său profesional a început în cadrul Spitalului Clinic de Urgență Floreasca, continuând în echipa de transplant de la Institutul Clinic Fundeni, experiențe care au contribuit la formarea sa chirurgicală.',
      'În cadrul acestui workshop, veți avea ocazia să pătrundeți în universul chirurgiei bariatrice și să descoperiți principiile și particularitățile acestei specialități. Printr-o abordare practică, de tip hands-on, veți putea explora tehnici și manevre chirurgicale specifice, înțelegând mai bine etapele unei intervenții și provocările întâlnite în practica operatorie. Va fi o oportunitate de a îmbina cunoștințele teoretice cu experiența practică și de a descoperi perspectiva chirurgului asupra managementului pacientului cu obezitate.',
    ].join('\n\n'),
    image: '/projects/path/workshops/ruxandra-marian.webp',
    imageAlt: 'Dr. Ruxandra Marian, medic specialist în chirurgie generală.',
  },
  {
    slug: 'glp-1-receptor-agonists',
    title: 'GLP-1 Receptor Agonists: The Game Changer – O nouă eră în managementul obezității',
    doctor: 'Dr. Ștefania Nemeș',
    doctorRole: 'Medic rezident în Diabet Zaharat, Nutriție și Boli Metabolice',
    description: [
      'Workshopul aduce în prim-plan rolul agoniștilor receptorilor GLP-1 în abordarea modernă a obezității.',
      'Participanții vor avea ocazia să descopere mecanismele fiziopatologice care stau la baza acțiunii acestor terapii, să înțeleagă rolul lor în reglarea apetitului și a metabolismului și să exploreze impactul pe care îl au asupra abordării moderne a pacientului cu obezitate.',
      'Sub coordonarea doamnei dr. Ștefania Nemeș, medic rezident în Diabet Zaharat, Nutriție și Boli Metabolice în cadrul Institutului Național de Diabet, Nutriție și Boli Metabolice „Prof. Dr. N. C. Paulescu”, workshopul va îmbina fundamentele fiziopatologice cu aplicațiile clinice și beneficiile metabolice și cardiovasculare ale acestor terapii.',
      'Sesiunea se adresează studenților la medicină interesați de inovațiile terapeutice și de noile perspective în managementul obezității.',
    ].join('\n\n'),
    image: '/projects/path/workshops/stefania-nemes.webp',
    imageAlt: 'Dr. Ștefania Nemeș, medic rezident în Diabet Zaharat, Nutriție și Boli Metabolice.',
  },
  {
    slug: 'ecografia-obstetricala',
    title: 'O privire în viața intrauterină – arta ecografiei obstetricale',
    doctor: 'Drd. dr. Eliza Maria Cloțea',
    doctorRole: 'Medic specialist Obstetrică-Ginecologie',
    secondDoctor: {
      name: 'Prof. univ. dr. Claudia Mehedințu',
      role: 'Medic primar Obstetrică-Ginecologie',
      image: '/projects/path/workshops/claudia-mehedintu.webp',
      imageAlt: 'Prof. univ. dr. Claudia Mehedințu, medic primar Obstetrică-Ginecologie.',
    },
    description: [
      'Te-ai întrebat vreodată care este primul moment în care pot fi decelate bătăile inimii în sarcină? Cum se estimează greutatea fătului? Sau la ce alte aspecte este atent medicul ginecolog pe parcursul sarcinii, pentru a se asigura că aceasta evoluează corespunzător?',
      'În cadrul workshopului, la Art Clinic, doamnele Drd. dr. Eliza Maria Cloțea și Prof. univ. dr. Claudia Mehedințu te vor introduce în tainele ecografiei obstetricale și te vor ghida prin etapele esențiale ale evaluării ecografice în sarcină.',
      'Vei descoperi cum ecografia obstetricală ne permite să privim direct în lumea copilului nenăscut, să-i urmărim creșterea, mișcările și bătăile inimii. Totodată, ne ajută să evaluăm starea de sănătate a mamei și felul în care organismul ei susține sarcina. Ecografia este astfel un instrument care îi are în grijă pe amândoi pacienții: mama și copilul.',
      'După o introducere teoretică în principiile ecografiei obstetricale, vom trece direct la practică în sesiunile hands-on, unde vei exersa pas cu pas sub îndrumarea coordonatorilor.',
    ].join('\n\n'),
    image: '/projects/path/workshops/eliza-maria-clotea.webp',
    imageAlt: 'Drd. dr. Eliza Maria Cloțea, medic specialist Obstetrică-Ginecologie.',
    location: 'Art Clinic',
  },
  {
    slug: 'victime-multiple',
    title: 'Măsuri medicale de urgență într-un eveniment cu victime multiple',
    doctor: 'Conf. univ. dr. Silvia Nica',
    doctorRole: 'Disciplina Medicină de Urgență și Prim Ajutor, U.M.F. „Carol Davila” București',
    description: [
      'Conf. univ. dr. Silvia Nica, din cadrul Disciplinei Medicină de Urgență și Prim Ajutor, U.M.F. „Carol Davila” București, vă invită să descoperiți provocările medicinei de urgență în gestionarea situațiilor cu victime multiple și importanța coordonării echipelor de intervenție în astfel de momente critice.',
      'În cadrul acestui workshop, veți avea ocazia să participați la simularea unui scenariu de accident rutier major, produs pe autostradă, în care sunt implicate mai multe autovehicule. Situația prezentată s-a soldat cu un număr mare de victime ce impune activarea Planului Roșu de Intervenție. Veți parcurge principalele etape ale gestionării unui astfel de eveniment: de la alertarea, mobilizarea resurselor și organizarea intervenției la locul accidentului, până la triajul medical al victimelor, acordarea primului ajutor și a asistenței medicale de urgență, stabilizarea și evacuarea acestora către unitățile sanitare. O experiență prin care veți putea înțelege cât de importante sunt rapiditatea deciziilor, prioritizarea și colaborarea într-o intervenție de amploare.',
      'Prin intermediul workshopurilor organizate de PATH ne dorim să dobândiți abilități necesare în practica medicală. Așadar, pregătiți-vă să luați parte la o experiență în care fiecare decizie contează, iar fiecare secundă poate salva o viață!',
    ].join('\n\n'),
    image: '/projects/path/workshops/silvia-nica.webp',
    imageAlt: 'Conf. univ. dr. Silvia Nica, Disciplina Medicină de Urgență și Prim Ajutor, U.M.F. „Carol Davila” București.',
  },
  {
    slug: 'notiuni-introductive-ecg',
    title: 'Noțiuni introductive de ECG',
    doctor: 'Dr. Adrian Florescu',
    doctorRole: 'Medic rezident în cardiologie, doctorand UMFCD',
    description: [
      'Sub îndrumarea Dr. Adrian Florescu, medic rezident în cardiologie și doctorand UMFCD, vom învăța cum să abordăm sistematic o electrocardiogramă, pas cu pas.',
      'Vom descoperi împreună cum să recunoaștem undele și intervalele esențiale, cum să identificăm corect ritmul cardiac și cum să înțelegem principalele modificări ECG.',
      'Totul va fi îmbinat cu exemple practice și exerciții interactive, astfel încât să transformăm teoria în abilități utile în practica medicală.',
      'Fie că ești la primul contact cu ECG-ul sau vrei să îți consolidezi bazele, te așteptăm să descifrăm împreună fiecare linie, undă și bătaie a inimii.',
    ].join('\n\n'),
    image: '/projects/path/workshops/adrian-florescu.webp',
    imageAlt: 'Dr. Adrian Florescu, medic rezident în cardiologie.',
  },
  {
    slug: 'detectiv-in-reumatologie',
    title: 'Detectiv în reumatologie: Cazul articulației dureroase',
    doctor: 'Drd. dr. Oana Georgiana Prioteasa',
    doctorRole: 'Medic specialist reumatolog',
    description: [
      'Durerea articulară este unul dintre cele mai frecvente motive de prezentare la medic, dar și o veritabilă provocare clinică: mecanică sau inflamatorie? Degenerativă sau autoimună?',
      'Pornind de la anamneză și examenul obiectiv specific, participanții vor învăța să construiască un raționament clinic corect și să orienteze diagnosticul diferențial fără a se pierde în zecile de investigații paraclinice disponibile.',
      'Sub coordonarea drd. dr. Oana Georgiana Prioteasa, medic specialist reumatolog în cadrul Secției de Reumatologie a Spitalului Universitar de Urgență Militar Central „Dr. Carol Davila”, workshopul va îmbina noțiunile teoretice cu tehnicile practice de examinare și analiza unor cazuri clinice.',
      'Sesiunea se adresează studenților la medicină interesați de reumatologie, în dezvoltarea abilităților clinice și de formarea unui raționament medical corect.',
      'Vă invităm să descoperiți cum fiecare indiciu clinic poate contribui la identificarea diagnosticului corect.',
    ].join('\n\n'),
    image: '/projects/path/workshops/oana-georgiana-prioteasa.webp',
    imageAlt: 'Drd. dr. Oana Georgiana Prioteasa, medic specialist reumatolog.',
  },
  {
    slug: 'managementul-fracturii',
    title: 'Managementul fracturii: principii, reducere și fixare',
    doctor: 'Lt. dr. Gabriel Baraboi',
    doctorRole: 'Medic rezident Ortopedie-Traumatologie',
    description: [
      'Te fascinează ortopedia și vrei să descoperi ce presupune tratamentul chirurgical al unei fracturi, dincolo de noțiunile teoretice?',
      'Lt. Dr. Gabriel Baraboi este medic rezident în specialitatea Ortopedie-Traumatologie, domeniu în care precizia, îndemânarea și alegerea conduitei terapeutice joacă un rol esențial. Activitatea în această specialitate presupune înțelegerea particularităților fiecărei fracturi și aplicarea principiilor de reducere și fixare pentru restabilirea anatomiei și funcționalității segmentului afectat.',
      'În cadrul acestui workshop, veți avea ocazia să descoperiți etapele managementului unei fracturi pornind de la prezentarea unui caz clinic. Ulterior, veți lucra în echipe de câte 2-3 participanți, utilizând instrumentar specific, precum motorul chirurgical, burghiele și plăcile de osteosinteză, pentru a realiza reducerea și fixarea unor fracturi pe modele de simulare. O experiență interactivă prin care vă veți familiariza cu instrumentele utilizate în sala de operație!',
      'Nu rata ocazia de a descoperi latura practică a ortopediei și de a experimenta provocările chirurgiei traumatologice! Vă așteptăm cu mare drag!',
    ].join('\n\n'),
    image: '/projects/path/workshops/gabriel-baraboi.webp',
    imageAlt: 'Lt. dr. Gabriel Baraboi, medic rezident Ortopedie-Traumatologie.',
  },
  {
    slug: 'detectiv-in-endocrine',
    title: 'Detectiv în endocrine: de la semne clinice subtile la tehnologia modernă în diabet',
    doctor: 'Dr. Popescu Eduard Mihail',
    doctorRole: 'Medic rezident Diabet Zaharat, Nutriție și Boli Metabolice',
    description: [
      'Participanții vor descoperi noțiuni esențiale despre boală, tratament și evoluția pompelor de insulină, înțelegând importanța acestora în menținerea controlului glicemic.',
      'Prin analiza unor grafice reale de glicemie, studenții vor putea observa diferențele dintre un control glicemic echilibrat și unul dificil, descoperind provocările cotidiene ale persoanelor cu diabet.',
      'Partea practică le va oferi oportunitatea de a monta și explora funcționarea pompelor de insulină, familiarizându-se cu utilizarea acestor dispozitive.',
      'Sub coordonarea dr. Popescu Eduard Mihail, medic rezident Diabet Zaharat, Nutriție și Boli Metabolice în cadrul Spitalului Universitar de Urgență „Elias”, workshopul va îmbina informațiile teoretice cu experiența practică.',
      'Sesiunea se adresează studenților la medicină interesați de diabetologie și de inovațiile tehnologice din domeniul medical.',
      'Vă invităm să descoperiți cum tehnologia contribuie la îmbunătățirea vieții pacienților cu diabet zaharat de tip 1!',
    ].join('\n\n'),
    image: '/projects/path/workshops/eduard-mihail-popescu.webp',
    imageAlt: 'Dr. Popescu Eduard Mihail, medic rezident Diabet Zaharat, Nutriție și Boli Metabolice.',
  },
  {
    slug: 'medicina-legala',
    title: 'Dincolo de o deviză renascentistă: cum ajută moartea viața în practica medicală actuală',
    doctor: 'Asist. univ. drd. dr. Pîrvu Vlad-Andrei',
    description: [
      'Cum putem înțelege evoluția unei boli prin examinarea corpului uman după deces? Ce informații poate oferi examinarea medico-legală despre cauzele unui deces și cum pot acestea contribui la progresul medicinei?',
      'Încă din secolul al XVI-lea, odată cu primele disecții anatomice, medicii au înțeles că descifrarea complexității corpului uman presupune mai mult decât studiul tratatelor medicale. Observarea directă și explorarea structurilor anatomice au deschis noi perspective asupra înțelegerii bolilor, punând bazele progresului medical.',
      'În cadrul workshopului, Asist. Univ. Drd. Dr. Pîrvu Vlad-Andrei te va ghida într-o incursiune în lumea medicinei legale, explorând rolul autopsiei medico-legale dincolo de stabilirea cauzei morții. Vei descoperi cum fiecare examinare poate contribui la reconstituirea circumstanțelor unui deces, la identificarea unor afecțiuni necunoscute și la înțelegerea unor mecanisme patologice cu implicații importante pentru sănătatea publică.',
      'Cunoașterea începe cu întrebările potrivite. Descoperă PATH și lasă curiozitatea să te ghideze!',
    ].join('\n\n'),
    image: '/projects/path/workshops/vlad-andrei-pirvu.webp',
    imageAlt: 'Asist. univ. drd. dr. Pîrvu Vlad-Andrei.',
  },
  {
    slug: 'patologie-hematologica',
    title: 'Explorarea microscopică a patologiei hematologice',
    doctor: 'Prof. univ. dr. Ana-Maria Vlădăreanu',
    doctorRole: 'Medic primar Hematologie, șefa Clinicii de Hematologie la SUUB',
    secondDoctor: {
      name: 'Conf. univ. dr. Cristina Mambet',
      role: 'Medic primar în hematologie și medicină de laborator',
      image: '/projects/path/workshops/cristina-mambet.webp',
      imageAlt: 'Conf. univ. dr. Cristina Mambet, medic primar în hematologie și medicină de laborator.',
    },
    description: [
      'Te-ai întrebat vreodată ce se ascunde în spatele unei simple hemoleucograme și cât de multe informații despre sănătatea unui pacient poate dezvălui sângele?',
      'Alături de doamnele doctor Prof. Univ. Dr. Ana-Maria Vlădăreanu — medic primar Hematologie, șefa Clinicii de Hematologie la SUUB și profesor universitar la UMF „Carol Davila” — și Conf. Univ. Dr. Cristina Mambet — medic primar în hematologie și medicină de laborator (hemobiologie), doctor în științe medicale și cercetător științific, explorăm complexitatea afecțiunilor hematologice, îmbinând experiența clinică și academică cu cele mai noi direcții din cercetarea biomedicală.',
      'În cadrul acestui workshop vom examina atât frotiuri de sânge periferic, cât și cele de aspirat medular, urmărind principalele modificări morfologice eritrocitare (de mărime, formă și hemoglobină) orientative pentru anemii, celulele atipice (blaști, celule limfomatoase) din neoplaziile mieloide sau limfoide, precum și anomaliile numerice și dimensionale ale trombocitelor din patologia malignă și non-malignă. Vom descoperi cum se îmbină raționamentul clinic, investigațiile de laborator și experiența medicului în luarea deciziilor care pot schimba evoluția unui pacient.',
      'Explorează detalii esențiale din culisele diagnosticului hematologic!',
    ].join('\n\n'),
    image: '/projects/path/workshops/ana-maria-vladareanu.webp',
    imageAlt: 'Prof. univ. dr. Ana-Maria Vlădăreanu, medic primar Hematologie.',
  },
  {
    slug: 'explorare-oculara',
    title: 'Diagnostic și explorare oculară',
    doctor: 'Prof. univ. dr. Alina Popa-Cherecheanu',
    doctorRole: 'Medic primar oftalmolog, Șeful Clinicii de Oftalmologie SUUB',
    description: [
      'Te-ai întrebat vreodată câte informații poate dezvălui o simplă examinare a ochiului și cum reușește medicul oftalmolog să descopere afecțiuni dincolo de ceea ce este vizibil la prima vedere?',
      'Prof. Univ. Dr. Alina Popa-Cherecheanu este medic primar oftalmolog, doctor în medicină și Șeful Clinicii de Oftalmologie din cadrul Spitalului Universitar de Urgență București (SUUB). Prin experiența sa clinică și academică, ne va ghida în descoperirea complexității diagnosticului oftalmologic și a metodelor moderne de explorare oculară.',
      'În cadrul acestui workshop vom descoperi cum se desfășoară un consult oftalmologic, vom explora rolul aparaturii de specialitate și vom învăța să interpretăm rezultatele investigațiilor în contextul diferitelor patologii oculare.',
      'Pregătește-te să privești oftalmologia dintr-o perspectivă nouă și să descoperi ce se află dincolo de ceea ce vede ochiul!',
    ].join('\n\n'),
    image: '/projects/path/workshops/alina-popa-cherecheanu.webp',
    imageAlt: 'Prof. univ. dr. Alina Popa-Cherecheanu, medic primar oftalmolog.',
  },
  {
    slug: 'test-detect-protect',
    title: 'TEST. DETECT. PROTECT. – HIV, Hepatite și Sifilis',
    doctor: 'ARAS – Asociația Română Anti-SIDA',
    description: [
      'Workshopul „TEST. DETECT. PROTECT. – HIV, Hepatite și Sifilis”, organizat alături de reprezentanții ARAS, aduce în prim-plan importanța prevenției și depistării precoce a infecțiilor cu transmitere sexuală.',
      'Participanții vor descoperi informații esențiale despre HIV, hepatitele virale și sifilis, explorând metodele de testare, strategiile de prevenție și opțiunile de profilaxie și tratament.',
      'Prin activități practice și discuții interactive, studenții vor avea ocazia să se familiarizeze cu procesul de testare și să înțeleagă importanța diagnosticului precoce.',
      'Workshopul pune accent și pe combaterea stigmatizării, promovând o abordare responsabilă, empatică și lipsită de prejudecăți față de persoanele afectate.',
      'Vă invităm să descoperiți cât de importante sunt testarea, informarea și prevenția: TEST. DETECT. PROTECT.',
    ].join('\n\n'),
    image: '/projects/path/workshops/aras.webp',
    imageAlt: 'Sigla ARAS – Asociația Română Anti-SIDA.',
  },
]

/** Ora serverului, în secunde; ținută aici ca randarea componentelor să rămână pură. */
export function currentEpochSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

function pathCard(): ProjectCard {
  return {
    slug: PATH_SLUG,
    title: pathProject.title,
    kicker: pathProject.kicker,
    summary: pathProject.summary,
    coverImage: PATH_COVER,
    coverPositionX: 50,
    coverPositionY: 50,
    kind: 'standard',
    span: '',
    href: PATH_HREF,
  }
}

/**
 * Adaugă PATH în lista de proiecte, imediat după congres. Dacă asociația
 * creează ulterior din admin un proiect cu același slug, acela are prioritate.
 */
export function withPathProject(projects: ProjectCard[]): ProjectCard[] {
  if (projects.some(project => project.slug === PATH_SLUG)) return projects
  const congressCount = projects.filter(project => project.kind === 'congress').length
  return [...projects.slice(0, congressCount), pathCard(), ...projects.slice(congressCount)]
}

/** Adaugă ediția PATH la evenimentele viitoare, până la încheierea ei. */
export function withPathEvent(events: UpcomingEvent[], now: number = Date.now(), limit = 3): UpcomingEvent[] {
  if (now >= Date.parse(pathProject.endsAt)) return events
  if (events.some(event => event.href === PATH_HREF)) return events
  const started = now >= Date.parse(pathProject.startsAt)
  const registrationOpen = !started && pathProject.registrationHref !== null && now >= Date.parse(pathProject.registrationOpensAt)
  const pathEvent: UpcomingEvent = {
    id: 'path-2026',
    title: 'PATH 2026',
    projectTitle: pathProject.tagline,
    summary: pathProject.summary,
    href: PATH_HREF,
    coverImage: PATH_COVER,
    coverPositionX: 50,
    coverPositionY: 50,
    startDate: new Date(pathProject.startsAt).toISOString(),
    // Ultima zi, nu miezul nopții de după: altfel intervalul afișat ar include 6 decembrie.
    endDate: new Date(Date.parse(pathProject.endsAt) - 1).toISOString(),
    status: started ? 'active' : 'upcoming',
    note: started ? undefined : registrationOpen ? 'Înscrierile sunt deschise' : `Înscrieri pe site din ${pathProject.registrationOpensLabel}`,
    theme: 'path',
    action: registrationOpen ? { href: PATH_REGISTRATION_HREF, label: 'Cumpără bilet' } : undefined,
  }
  return [...events, pathEvent]
    .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))
    .slice(0, limit)
}

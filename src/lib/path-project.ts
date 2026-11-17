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
    note: started ? undefined : `Înscrieri pe site din ${pathProject.registrationOpensLabel}`,
    theme: 'path',
  }
  return [...events, pathEvent]
    .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999'))
    .slice(0, limit)
}

import { mimesissScenePhotos } from './mimesiss-scene'

export type ProjectId = 'mimesiss' | 'bal' | 'cort'

export type StoryProject = {
  id: ProjectId
  title: string
  kicker: string
  subtitle: string
  description: string[]
  hero: string
  heroAlt: string
  sections?: { title: string; subtitle: string; description: string; image: string; imageAlt: string }[]
  gallery: { src: string; alt: string }[]
}

export const projects: StoryProject[] = [
  {
    id: 'mimesiss',
    title: 'MIMESISS',
    kicker: 'Congres de medicină militară · Ediția a V-a · 2025',
    subtitle: 'Cunoașterea ne formează, experiența ne definește, iar medicina ne unește.',
    description: [
      'MIMESISS este un spațiu dedicat pasiunii pentru medicină, învățării și evoluției. Mai mult decât un congres, reprezintă o oportunitate de a construi relații între studenți și profesioniști din domeniul medical, într-un mediu care încurajează schimbul de idei, curiozitatea și dezvoltarea continuă.',
      'Prin experiența și dedicarea celor implicați, fiecare ediție devine un pas înainte în formarea viitorilor medici.',
    ],
    hero: '/project-stories/Poza_1.webp',
    heroAlt: 'Colaj MIMESISS cu lectori și participanți, pe un fundal de neuroni.',
    sections: [
      {
        title: 'Workshopuri',
        subtitle: 'De la teorie la practică',
        description: 'Într-un cadru interactiv, studenții pot explora diverse tehnici medicale, își pot exersa îndemânarea și pot face primii pași spre gestionarea unor situații întâlnite în practica de zi cu zi. Fie că este vorba despre tehnici de sutură, explorări ecografice, intervenții de urgență sau proceduri specifice medicinei operaționale, fiecare activitate pune accent pe aplicarea cunoștințelor, atenția la detalii și lucrul în echipă. Îndrumarea specialiștilor transformă fiecare exercițiu într-o oportunitate de progres, oferindu-le participanților mai multă încredere și o imagine mai clară asupra responsabilităților pe care le presupune această profesie.',
        image: '/project-stories/Poza_2.webp',
        imageAlt: 'Colaj cu studenți la activități practice de disecție și simulare medicală.',
      },
      {
        title: 'Conferințe',
        subtitle: 'Idei care deschid noi perspective',
        description: 'Conferințele aduc în atenția participanților subiecte relevante pentru medicina contemporană, oferind o perspectivă asupra complexității și diversității practicii medicale. De la evoluțiile din cercetare și abordările terapeutice moderne, până la gestionarea situațiilor clinice dificile, fiecare întâlnire creează contextul ideal pentru aprofundarea cunoștințelor și explorarea unor noi direcții de învățare. Dialogul cu specialiștii și schimbul liber de opinii îi provoacă pe studenți să privească dincolo de informațiile teoretice și să își contureze propriul mod de a gândi și de a înțelege medicina.',
        image: '/project-stories/Poza_3.webp',
        imageAlt: 'Lectori și participanți la conferințele congresului MIMESISS.',
      },
    ],
    gallery: [
      ...mimesissScenePhotos.map(({ src, alt }) => ({ src, alt })),
      { src: '/project-stories/originals/workshops/img-9186-heic-2757809.webp', alt: 'Demonstrație practică de disecție la workshopurile MIMESISS.' },
      { src: '/project-stories/originals/workshops/4db1e4c6-dbf7-4d16-bcd8-cdbfa1854fd5-jpeg-5691f44.webp', alt: 'Exercițiu practic de anatomie cu instrumente de disecție.' },
      { src: '/project-stories/originals/workshops/img-6481-heic-0490462.webp', alt: 'Participanți la un exercițiu de simulare medicală, folosind echipamentul din atelier.' },
      { src: '/project-stories/Poza_3.webp', alt: 'Conferințe și dialog la MIMESISS' },
    ],
  },
  {
    id: 'bal',
    title: 'Balul bobocilor',
    kicker: '',
    subtitle: 'Locul în care munca și talentul prind viață, iar emoția le dă strălucire.',
    description: [
      'Suspans, emoție, talent, curaj… sunt doar câteva cuvinte care descriu seara magică a balului bobocilor.',
      'Bobocii, mentorii și toți cei din spatele unui astfel de proiect reușesc an de an să pună în scenă spectacole pline de carismă și energie, valorificând teme precum: „Error 404: Reality not found”, „Unusual first date” sau „Faces of fame”.',
      'Emoția și bucuria unui astfel de moment creionează în inima fiecărui participant o amintire de neuitat din frumoasa perioadă a studenției, datorită familiei ASMM, care asigură de fiecare dată buna desfășurare a acestui demers artistic.',
    ],
    hero: '/project-stories/Poza_4.webp',
    heroAlt: 'Patru momente artistice de la Balul bobocilor, într-un colaj cu margini de hârtie ruptă.',
    gallery: [
      { src: '/project-stories/originals/ball/img-9112-355bf49.webp', alt: 'Moment muzical cu chitară și voce la Balul bobocilor' },
      { src: '/project-stories/originals/ball/img-8957-c38c6fd.webp', alt: 'Doi participanți pe scena Balului bobocilor' },
      { src: '/project-stories/originals/ball/img-8234-b564a7e.webp', alt: 'Moment de spectacol inspirat de Aladdin' },
      { src: '/project-stories/originals/ball/img-8401-a4dda6c.webp', alt: 'Un dans în doi la Balul bobocilor' },
      { src: '/project-stories/originals/ball/img-7595-299b197.webp', alt: 'Moment de grup pe scena Balului bobocilor.' },
      { src: '/project-stories/originals/ball/img-8563-da50c9a.webp', alt: 'O participantă într-un moment artistic pe scena Balului bobocilor.' },
    ],
  },
  {
    id: 'cort',
    title: 'Cortul de la Simularea Admiterii UMFCD',
    kicker: '',
    subtitle: '',
    description: [
      'Într-o zi în care stresul acaparează toate simțurile, ziua Simulării Examenului de Admitere, studenții Institutului Medico Militar te așteaptă să te destinzi și te invită la o serie de activități în cortul IMM.',
      'Acesta este dotat cu machete și instrumente pentru acordarea primului ajutor, iar studenții coordonatori sunt disponibili oricând pentru a răspunde la orice întrebare.',
    ],
    hero: '/project-stories/Poza_6.webp',
    heroAlt: 'Echipa IMM și vizitatorii cortului, la activități de prim ajutor și prezentări medicale.',
    gallery: [
      { src: '/project-stories/Poza_5.1.webp', alt: 'Explicarea unei investigații medicale la cortul IMM' },
      { src: '/project-stories/Poza_5.2.webp', alt: 'Demonstrații de prim ajutor pentru viitorii studenți' },
      { src: '/project-stories/Poza_5.3.webp', alt: 'Exersarea resuscitării pe un manechin la cortul IMM' },
      { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-29-3-jpg-20a4e92.webp', alt: 'Echipa IMM în fața cortului, la simularea admiterii.' },
      { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-30-8-jpg-4804ad2.webp', alt: 'Studenți și vizitatori lângă masa cu materiale de prim ajutor.' },
      { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-31-8-jpg-8f5e803.webp', alt: 'Discuție cu vizitatorii în apropierea cortului IMM.' },
      { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-28-2-jpg-0433dbb.webp', alt: 'Vizitatori și studenți militari în fața cortului IMM.' },
      { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-32-3-jpg-3d9a5ab.webp', alt: 'Explicații despre o investigație imagistică, la cortul IMM.' },
      { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-31-7-jpg-26254a9.webp', alt: 'Exersarea primului ajutor pe un manechin, în cortul IMM.' },
    ],
  },
]

export const statement = 'Medicina se descoperă prin cunoaștere, se învață prin practică și se construiește prin oameni.'

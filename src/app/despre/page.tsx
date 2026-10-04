import type { Metadata } from 'next'
import HeaderContent from '@/components/ui/HeaderContent'
import PersonCard from '@/components/ui/PersonCard'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Despre noi',
  description: 'Cunoaște echipa ASMM: Consiliul Director și Consiliul Director Extins al Asociației Studenților în Medicină Militară.',
}

const board = [
  { name: 'Boșcă Mihai Iulian', role: 'Președinte ASMM', imageUrl: '/pics/echipa/bosca-mihai-iulian-cutout.webp', imageOffsetX: 6 },
  { name: 'Oncel Mara Elena', role: 'Secretar General', imageUrl: '/pics/echipa/oncel-mara-elena-cutout.webp', imageOffsetX: 12 },
  { name: 'Nebunu Andrada Daniela', role: 'Vicepreședinte pentru relații externe', imageUrl: '/pics/echipa/nebunu-andrada-daniela-cutout.webp', imageOffsetX: 4 },
  { name: 'Neacșu Georgiana Rebeca', role: 'Trezorier', imageUrl: '/pics/echipa/neacsu-georgiana-rebeca-cutout.webp', imageOffsetX: 0 },
  { name: 'Marin Teodor Ștefan', role: 'Vicepreședinte pentru relații interne', imageUrl: '/pics/echipa/marin-teodor-stefan-cutout.webp', imageOffsetX: -6.5 },
]

const extendedBoard = [
  { name: 'Tănase Nicoleta', role: 'Șef Departament Logistică', imageUrl: '/pics/echipa/tanase-nicoleta-cutout.webp', imageOffsetX: 15 },
  { name: 'Focșa Cosmina Ștefania', role: 'Șef Departament MM', imageUrl: '/pics/echipa/focsa-cosmina-stefania-cutout.webp', imageOffsetX: 6.5 },
  { name: 'Codiță Maria Alexandra', role: 'Șef Departament HR', imageUrl: '/pics/echipa/codita-maria-alexandra-cutout.webp', imageOffsetX: -2 },
  { name: 'Stan Denisa Maria', role: 'Șef Departament FR', imageUrl: '/pics/echipa/stan-denisa-maria-cutout.webp', imageOffsetX: 3 },
  { name: 'Mitrache Ana Ilinca', role: 'Șef Departament Grafică', imageUrl: '/pics/echipa/mitrache-ana-ilinca-cutout.webp', imageOffsetX: 12.5 },
  { name: 'Manole Daria Gabriela', role: 'Șef Departament PR', imageUrl: '/pics/echipa/manole-daria-gabriela-cutout.webp', imageOffsetX: 17 },
]

export default function AboutPage() {
  return (
    <>
      <HeaderContent kicker="Asociația · Echipa" title="Studenți la medicină militară" breadcrumbLabel="Despre noi" titleClassName={styles.mobileTitle} />
      <div className={styles.page}>
        <section id="consiliul-director" aria-labelledby="board-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Echipa de conducere</p>
            <h2 id="board-title">Consiliul Director</h2>
          </div>
          <div className={`${styles.grid} ${styles.board}`}>
            {board.map((person, index) => <PersonCard key={person.name} {...person} priority={index === 0} />)}
          </div>
        </section>
        <section id="consiliul-director-extins" aria-labelledby="extended-board-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Coordonatorii departamentelor</p>
            <h2 id="extended-board-title">Consiliul Director Extins</h2>
          </div>
          <div className={styles.grid}>
            {extendedBoard.map(person => <PersonCard key={person.name} {...person} />)}
          </div>
        </section>
      </div>
    </>
  )
}

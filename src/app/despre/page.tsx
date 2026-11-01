import type { Metadata } from 'next'
import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'
import HeaderContent from '@/components/ui/HeaderContent'
import PersonCard from '@/components/ui/PersonCard'
import { associationDepartments, associationMission, associationPillars, associationStats, involvementSteps } from '@/lib/association-content'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Despre noi',
  description: 'Misiunea, activitățile, departamentele și echipa Asociației Studenților în Medicină Militară. Află cum te poți implica în ASMM.',
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
      <HeaderContent kicker="Asociația · Misiune și echipă" title="Studenți la medicină militară" breadcrumbLabel="Despre noi" titleClassName={styles.mobileTitle} />
      <div className={styles.page}>
        <section id="misiune" aria-labelledby="mission-title" className={`${styles.section} ${styles.mission}`}>
          <div>
            <p className={styles.eyebrow}>Cine suntem</p>
            <h2 id="mission-title" className={styles.missionTitle}>Studenți care învață unii de la alții.</h2>
          </div>
          <div>
            <p className={styles.lead}>{associationMission}</p>
            <dl className={styles.stats}>
              {associationStats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
            </dl>
          </div>
        </section>
        <section id="activitati" aria-labelledby="activities-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Ce facem</p>
            <h2 id="activities-title">Medicina militară, dincolo de curs</h2>
          </div>
          <ul className={styles.cards}>
            {associationPillars.map((pillar, index) => <li key={pillar.title}>
              <span className={styles.cardIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </li>)}
          </ul>
          <Link href="/proiecte" className={styles.textLink}>Vezi proiectele asociației <FaArrowRight aria-hidden="true" /></Link>
        </section>
        <section id="departamente" aria-labelledby="departments-title" className={styles.section}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Structura asociației</p>
            <h2 id="departments-title">Departamente</h2>
          </div>
          <ul className={styles.departments}>
            {associationDepartments.map(department => <li key={department.name}>
              <h3>{department.name}</h3>
              <p>{department.text}</p>
            </li>)}
          </ul>
        </section>
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
        <section id="implica-te" aria-labelledby="involve-title" className={`${styles.section} ${styles.involve}`}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Alătură-te</p>
            <h2 id="involve-title">Cum te poți implica</h2>
          </div>
          <ol className={styles.steps}>
            {involvementSteps.map(step => <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>)}
          </ol>
          <Link href="/contact" className={styles.button}>Scrie-ne <FaArrowRight aria-hidden="true" /></Link>
        </section>
      </div>
    </>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight, FaInstagram } from 'react-icons/fa'
import type { ProjectCard } from '@/lib/projects'
import type { Partner } from '@/lib/partner-types'
import type { UpcomingEvent } from '@/lib/events'
import { associationMission, associationPillars, associationStats } from '@/lib/association-content'
import PartnerMarquee from './PartnerMarquee'
import styles from './AssociationHome.module.css'

const INSTAGRAM_URL = 'https://www.instagram.com/asmm.bucuresti?igsh=MWExZHc0Y3hrNWh1bg=='

const dayFormat = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', timeZone: 'Europe/Bucharest' })
const monthFormat = new Intl.DateTimeFormat('ro-RO', { month: 'short', timeZone: 'Europe/Bucharest' })
const rangeFormat = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Bucharest' })

function eventDates(event: UpcomingEvent) {
  if (!event.startDate) return 'Data va fi anunțată'
  const start = new Date(event.startDate)
  const end = event.endDate ? new Date(event.endDate) : null
  return end && end.getTime() !== start.getTime() ? rangeFormat.formatRange(start, end) : rangeFormat.format(start)
}

export default function AssociationHome({ projects, partners = [], events = [] }: { projects: ProjectCard[]; partners?: Partner[]; events?: UpcomingEvent[] }) {
  return (
    <div className={styles.home} id="continut" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="association-title">
        <Image src="/old/3.jpeg" alt="" fill priority sizes="100vw" className={styles.heroPhoto} />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Asociația Studenților în Medicină Militară</p>
          <h1 id="association-title">Împreună, dincolo<br className={styles.desktopBreak} /> de amfiteatru.</h1>
          <Link href="/proiecte" className={styles.button}>Descoperă proiectele <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
      <div className={styles.energyBand} aria-label="Medicină, comunitate, experiențe, împreună">
        <div className={styles.energyBandInner}>
          <span>Medicină</span>
          <span>Comunitate</span>
          <span>Experiențe</span>
          <span>Împreună</span>
        </div>
      </div>
      <section data-entrance id="evenimente" aria-labelledby="events-title" className={styles.events}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Urmează</p><h2 id="events-title">Evenimente viitoare</h2></div>
          <Link href="/proiecte" className={styles.textLink}>Toate proiectele <FaArrowRight aria-hidden="true" /></Link>
        </div>
        {events.length > 0 ? <ol className={styles.eventList}>
          {events.map(event => {
            const start = event.startDate ? new Date(event.startDate) : null
            return <li key={event.id}>
              <Link href={event.href} className={styles.event}>
                <div className={styles.eventDate} aria-hidden="true">
                  {start ? <><span className={styles.eventDay}>{dayFormat.format(start)}</span><span className={styles.eventMonth}>{monthFormat.format(start).replace('.', '')}</span></> : <span className={styles.eventMonth}>în curând</span>}
                </div>
                <div className={styles.eventBody}>
                  <p className={styles.projectKicker}>{event.status === 'active' ? 'În desfășurare' : event.projectTitle}</p>
                  <h3>{event.title}</h3>
                  <p className={styles.eventWhen}>{eventDates(event)}</p>
                  <p className={styles.eventSummary}>{event.summary}</p>
                </div>
                <span className={styles.eventArrow} aria-hidden="true"><FaArrowRight /></span>
              </Link>
            </li>
          })}
        </ol> : <div className={styles.eventsEmpty}>
          <div>
            <h3>Pregătim următoarele evenimente.</h3>
            <p>Datele noilor workshopuri, conferințe și ale următoarei ediții MIMESISS apar aici imediat ce sunt anunțate. Până atunci, urmărește-ne pe Instagram.</p>
          </div>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.textLink}><FaInstagram aria-hidden="true" /> @asmm.bucuresti</a>
        </div>}
      </section>
      {projects.length > 0 && <section className={styles.projects} aria-labelledby="projects-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Implicare, tot anul</p><h2 id="projects-title">Proiectele asociației</h2></div>
          <Link href="/proiecte" className={styles.textLink}>Toate proiectele <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.projectGrid}>
          {projects.map(project => <Link key={project.slug} href={project.href} className={styles.project}>
            {project.coverImage && <div className={styles.projectImage}><Image src={project.coverImage} alt="" style={{ objectPosition: `${project.coverPositionX ?? 50}% ${project.coverPositionY ?? 50}%` }} fill sizes="(max-width: 760px) 100vw, 33vw" className={styles.cover} /></div>}
            <p className={styles.projectKicker}>{project.kicker || (project.kind === 'congress' ? 'Congres ASMM' : project.kind === 'announcement' ? 'Anunț ASMM' : 'Proiect ASMM')}</p>
            <h3>{project.title}</h3><p>{project.summary}</p>
            <span className={styles.textLink}>Află mai multe <FaArrowRight aria-hidden="true" /></span>
          </Link>)}
        </div>
      </section>}
      <section data-entrance className={styles.about} aria-labelledby="about-title">
        <div className={styles.aboutIntro}>
          <div><p className={styles.eyebrow}>Despre noi</p><h2 id="about-title">Studenți care învață<br />unii de la alții.</h2></div>
          <div>
            <p className={styles.aboutLead}>{associationMission}</p>
            <dl className={styles.stats}>
              {associationStats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
            </dl>
          </div>
        </div>
        <ul className={styles.pillars}>
          {associationPillars.map((pillar, index) => <li key={pillar.title}>
            <span className={styles.pillarIndex} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </li>)}
        </ul>
        <div className={styles.aboutActions}>
          <Link href="/despre" className={styles.button}>Cunoaște asociația <FaArrowRight aria-hidden="true" /></Link>
          <Link href="/despre#implica-te" className={styles.textLink}>Cum te poți implica <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
      <PartnerMarquee partners={partners} />
      <section className={styles.contact} aria-labelledby="contact-title"><div><p className={styles.contactEyebrow}>Hai să vorbim</p><h2 id="contact-title">Ai o idee? Construim împreună.</h2></div><Link href="/contact" className={styles.button}>Contactează-ne <FaArrowRight aria-hidden="true" /></Link></section>
    </div>
  )
}

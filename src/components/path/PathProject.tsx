import Image from 'next/image'
import Link from 'next/link'
import { FaArrowLeft, FaArrowRight, FaCalendarAlt, FaInstagram, FaMapMarkerAlt, FaUserMd } from 'react-icons/fa'
import { pathHighlights, pathProject, pathStory, pathWorkshops } from '@/lib/path-project'
import { PathHeroTimer, PathRegistration } from './PathTimeline'
import styles from './PathProject.module.css'

const INSTAGRAM_URL = 'https://www.instagram.com/asmm.bucuresti'

export default function PathProject({ renderedAt }: { renderedAt: number }) {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="path-title">
        <Image src="/projects/path/helix.webp" alt="" fill priority sizes="100vw" className={styles.heroArt} />
        <div className={styles.heroShade} />
        <div className={styles.heroInner}>
          <Link href="/proiecte" className={styles.back}><FaArrowLeft aria-hidden="true" /> Toate proiectele</Link>
          <p className={styles.kicker}>Proiect ASMM · Prima ediție</p>
          <h1 id="path-title" className={styles.wordmark}>{pathProject.title}</h1>
          <p className={styles.tagline}>{pathProject.tagline}</p>
          <p className={styles.lead}>{pathProject.summary}</p>
          <ul className={styles.facts}>
            <li><FaCalendarAlt aria-hidden="true" /> {pathProject.dateLabel}</li>
            <li>Înscrieri pe site din {pathProject.registrationOpensLabel}</li>
          </ul>
          <div className={styles.heroBottom}>
            <PathHeroTimer renderedAt={renderedAt} />
            <div className={styles.heroActions}>
              <a href="#workshopuri" className={styles.primaryButton}>Workshopuri și medici <FaArrowRight aria-hidden="true" /></a>
              <a href="#inscrieri" className={styles.ghostButton}>Cum mă înscriu</a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.about} aria-labelledby="path-about-title">
        <div className={styles.aboutHeading}>
          <p className={styles.eyebrow}>Despre proiect</p>
          <h2 id="path-about-title">{pathStory.lead}</h2>
          <p className={styles.statement}>{pathStory.statement}</p>
        </div>
        <div className={styles.aboutCopy}>
          {pathStory.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <p className={styles.invitation}>{pathStory.invitation}</p>
        </div>
      </section>

      <section className={styles.highlights} aria-label="Ce găsești la PATH">
        <ul>
          {pathHighlights.map((item, index) => <li key={item.title} data-entrance>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </li>)}
        </ul>
      </section>

      <section id="workshopuri" className={styles.workshops} aria-labelledby="path-workshops-title">
        <div className={styles.workshopsInner}>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>Program</p>
            <h2 id="path-workshops-title">Workshopuri și medici</h2>
            <p>Fiecare workshop este susținut de un medic și pune accent pe practică.</p>
          </div>
          {pathWorkshops.length > 0 ? <ul className={styles.workshopGrid}>
            {pathWorkshops.map(workshop => <li key={workshop.title} className={styles.workshop} data-entrance>
              {workshop.image && <div className={styles.workshopImage}><Image src={workshop.image} alt={workshop.imageAlt ?? ''} fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div>}
              <div className={styles.workshopBody}>
                <h3>{workshop.title}</h3>
                <p className={styles.doctor}><FaUserMd aria-hidden="true" /><span><strong>{workshop.doctor}</strong>{workshop.doctorRole && <small>{workshop.doctorRole}</small>}</span></p>
                <p className={styles.workshopText}>{workshop.description}</p>
                {(workshop.schedule || workshop.location || workshop.seats) && <ul className={styles.workshopMeta}>
                  {workshop.schedule && <li><FaCalendarAlt aria-hidden="true" /> {workshop.schedule}</li>}
                  {workshop.location && <li><FaMapMarkerAlt aria-hidden="true" /> {workshop.location}</li>}
                  {workshop.seats && <li>{workshop.seats} locuri</li>}
                </ul>}
              </div>
            </li>)}
          </ul> : <div className={styles.workshopsSoon}>
            <div>
              <h3>Lista se publică în curând.</h3>
              <p>Workshopurile și medicii care le susțin apar aici imediat ce sunt anunțați. Până atunci, noutățile ajung mai întâi pe Instagram.</p>
            </div>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.ghostButton}><FaInstagram aria-hidden="true" /> @asmm.bucuresti</a>
          </div>}
        </div>
      </section>

      <section id="inscrieri" className={styles.registrationSection} aria-labelledby="inscrieri-title">
        <p className={styles.eyebrow}>Înscrieri</p>
        <PathRegistration renderedAt={renderedAt} />
      </section>

      <section className={styles.contact} aria-labelledby="path-contact-title">
        <div>
          <p className={styles.contactEyebrow}>Ai o întrebare despre PATH?</p>
          <h2 id="path-contact-title">Scrie-ne și îți răspundem.</h2>
        </div>
        <Link href="/contact" className={styles.contactButton}>Contactează-ne <FaArrowRight aria-hidden="true" /></Link>
      </section>
    </div>
  )
}

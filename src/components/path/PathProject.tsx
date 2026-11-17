import Image from 'next/image'
import Link from 'next/link'
import { FaArrowLeft, FaArrowRight, FaCalendarAlt, FaInstagram, FaUserMd } from 'react-icons/fa'
import { PATH_REGISTRATION_HREF, PATH_WORKSHOPS_HREF, pathHighlights, pathProject, pathStory, pathWorkshops } from '@/lib/path-project'
import { PathHeroTimer } from './PathTimeline'
import { INSTAGRAM_URL } from './PathWorkshops'
import styles from './PathProject.module.css'

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
              <Link href={PATH_WORKSHOPS_HREF} className={styles.primaryButton}>Workshopuri și medici <FaArrowRight aria-hidden="true" /></Link>
              <Link href={PATH_REGISTRATION_HREF} className={styles.ghostButton}>Cum mă înscriu</Link>
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

      <section className={styles.workshops} aria-labelledby="path-workshops-title">
        <div className={styles.workshopsInner}>
          <div className={styles.workshopsTeaser}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>Program</p>
              <h2 id="path-workshops-title">Workshopuri și medici</h2>
              <p>
                {pathWorkshops.length > 0
                  ? `${pathWorkshops.length} workshopuri, fiecare susținut de un medic și axat pe practică.`
                  : 'Lista workshopurilor și a medicilor se publică în curând.'}
              </p>
            </div>
            {pathWorkshops.length > 0
              ? <Link href={PATH_WORKSHOPS_HREF} className={styles.primaryButton}>Vezi workshopurile <FaArrowRight aria-hidden="true" /></Link>
              : <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.ghostButton}><FaInstagram aria-hidden="true" /> @asmm.bucuresti</a>}
          </div>
          {pathWorkshops.length > 0 && <ul className={styles.workshopIndex}>
            {pathWorkshops.map(workshop => <li key={workshop.title}>
              <Link href={PATH_WORKSHOPS_HREF}>
                <strong>{workshop.title}</strong>
                <span><FaUserMd aria-hidden="true" /> {workshop.doctor}{workshop.secondDoctor ? `, ${workshop.secondDoctor.name}` : ''}</span>
              </Link>
            </li>)}
          </ul>}
        </div>
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

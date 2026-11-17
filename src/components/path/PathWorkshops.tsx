import Image from 'next/image'
import Link from 'next/link'
import { FaArrowLeft, FaArrowRight, FaCalendarAlt, FaInstagram, FaMapMarkerAlt, FaUserMd } from 'react-icons/fa'
import { PATH_HREF, pathProject, pathWorkshops } from '@/lib/path-project'
import { PathRegistration } from './PathTimeline'
import styles from './PathProject.module.css'

export const INSTAGRAM_URL = 'https://www.instagram.com/asmm.bucuresti'

/** Lista completă: fiecare workshop cu medicul (sau medicii) care îl susțin. */
function PathWorkshopList() {
  if (pathWorkshops.length === 0) {
    return (
      <div className={styles.workshopsSoon}>
        <div>
          <h2>Lista se publică în curând.</h2>
          <p>Workshopurile și medicii care le susțin apar aici imediat ce sunt anunțați. Până atunci, noutățile ajung mai întâi pe Instagram.</p>
        </div>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={styles.ghostButton}><FaInstagram aria-hidden="true" /> @asmm.bucuresti</a>
      </div>
    )
  }

  return (
    <ul className={styles.workshopGrid}>
      {pathWorkshops.map(workshop => <li key={workshop.title} className={styles.workshop} data-entrance>
        {workshop.image && (workshop.secondDoctor?.image
          ? <div className={styles.workshopImages}>
            <div><Image src={workshop.image} alt={workshop.imageAlt ?? ''} fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 25vw, 17vw" /></div>
            <div><Image src={workshop.secondDoctor.image} alt={workshop.secondDoctor.imageAlt ?? ''} fill sizes="(max-width: 760px) 50vw, (max-width: 1100px) 25vw, 17vw" /></div>
          </div>
          : <div className={styles.workshopImage}><Image src={workshop.image} alt={workshop.imageAlt ?? ''} fill sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" /></div>)}
        <div className={styles.workshopBody}>
          <h2>{workshop.title}</h2>
          <p className={styles.doctor}><FaUserMd aria-hidden="true" /><span><strong>{workshop.doctor}</strong>{workshop.doctorRole && <small>{workshop.doctorRole}</small>}</span></p>
          {workshop.secondDoctor && <p className={styles.doctor}><FaUserMd aria-hidden="true" /><span><strong>{workshop.secondDoctor.name}</strong>{workshop.secondDoctor.role && <small>{workshop.secondDoctor.role}</small>}</span></p>}
          <p className={styles.workshopText}>{workshop.description}</p>
          {(workshop.schedule || workshop.location || workshop.seats) && <ul className={styles.workshopMeta}>
            {workshop.schedule && <li><FaCalendarAlt aria-hidden="true" /> {workshop.schedule}</li>}
            {workshop.location && <li><FaMapMarkerAlt aria-hidden="true" /> {workshop.location}</li>}
            {workshop.seats && <li>{workshop.seats} locuri</li>}
          </ul>}
        </div>
      </li>)}
    </ul>
  )
}

/** Pagina /proiecte/path/workshops: programul complet, apoi înscrierea. */
export default function PathWorkshopsPage({ renderedAt }: { renderedAt: number }) {
  return (
    <div className={styles.page}>
      <section className={`${styles.workshops} ${styles.workshopsPage}`} aria-labelledby="path-workshops-title">
        <div className={styles.workshopsInner}>
          <Link href={PATH_HREF} className={styles.back}><FaArrowLeft aria-hidden="true" /> Înapoi la PATH</Link>
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>PATH · {pathProject.dateLabel}</p>
            <h1 id="path-workshops-title">Workshopuri și medici</h1>
            <p>Fiecare workshop este susținut de un medic și pune accent pe practică.</p>
          </div>
          <PathWorkshopList />
        </div>
      </section>

      <section id="inscrieri" className={styles.registrationSection} aria-labelledby="inscrieri-title">
        <p className={styles.eyebrow}>Înscrieri</p>
        <PathRegistration renderedAt={renderedAt} />
      </section>

      <section className={styles.contact} aria-labelledby="path-contact-title">
        <div>
          <p className={styles.contactEyebrow}>Ai o întrebare despre un workshop?</p>
          <h2 id="path-contact-title">Scrie-ne și îți răspundem.</h2>
        </div>
        <Link href="/contact" className={styles.contactButton}>Contactează-ne <FaArrowRight aria-hidden="true" /></Link>
      </section>
    </div>
  )
}

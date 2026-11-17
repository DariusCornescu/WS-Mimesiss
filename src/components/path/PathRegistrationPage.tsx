import Link from 'next/link'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'
import { PATH_HREF, PATH_WORKSHOPS_HREF, pathProject } from '@/lib/path-project'
import { PathAudience, PathRegistration } from './PathTimeline'
import styles from './PathProject.module.css'

/** Pagina /proiecte/path/inscrieri: starea înscrierilor, separat de prezentare și de program. */
export default function PathRegistrationPage({ renderedAt }: { renderedAt: number }) {
  return (
    <div className={styles.page}>
      <section className={`${styles.workshops} ${styles.registrationPage}`} aria-labelledby="path-registration-title">
        <div className={styles.workshopsInner}>
          <Link href={PATH_HREF} className={styles.back}><FaArrowLeft aria-hidden="true" /> Înapoi la PATH</Link>
          <div className={styles.workshopsTeaser}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>PATH · {pathProject.dateLabel}</p>
              <h1 id="path-registration-title">Înscrieri</h1>
              <p>Biletul PATH include două workshopuri. Programul complet și medicii care le susțin sunt pe pagina workshopurilor.</p>
            </div>
            <Link href={PATH_WORKSHOPS_HREF} className={styles.ghostButton}>Workshopuri și medici <FaArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className={styles.registrationSection} aria-labelledby="inscrieri-title">
        <PathRegistration renderedAt={renderedAt} />
        <PathAudience renderedAt={renderedAt} />
      </section>

      <section className={styles.contact} aria-labelledby="path-contact-title">
        <div>
          <p className={styles.contactEyebrow}>Ai o întrebare despre înscriere?</p>
          <h2 id="path-contact-title">Scrie-ne și îți răspundem.</h2>
        </div>
        <Link href="/contact" className={styles.contactButton}>Contactează-ne <FaArrowRight aria-hidden="true" /></Link>
      </section>
    </div>
  )
}

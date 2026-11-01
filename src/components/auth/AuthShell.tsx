import { FiCalendar } from 'react-icons/fi'
import { HiOutlineTicket } from 'react-icons/hi2'
import styles from './auth.module.css'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.intro} aria-label="Comunitatea ASMM">
          <p className={styles.introTitle}>Învață.<br />Participă.<br /><span>Conectează-te.</span></p>
          <p className={styles.lead}>Un singur cont pentru evenimentele ASMM, înscrieri și bilete.</p>
          <ul className={styles.benefits}>
            <li><FiCalendar aria-hidden="true" /><div><p className={styles.benefitTitle}>Înscrieri la evenimente</p><p>Accesează și finalizează rapid înscrierile pentru evenimentele ASMM.</p></div></li>
            <li><HiOutlineTicket aria-hidden="true" /><div><p className={styles.benefitTitle}>Biletele tale, într-un singur loc</p><p>Gestionează ușor toate biletele evenimentelor tale.</p></div></li>
          </ul>
        </aside>
        <section className={styles.panel}>{children}</section>
      </div>
    </div>
  )
}


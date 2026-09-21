import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'
import type { ProjectCard } from '@/lib/projects'
import PartnerMarquee from './PartnerMarquee'
import styles from './AssociationHome.module.css'

export default function AssociationHome({ projects }: { projects: ProjectCard[] }) {
  const congress = projects.find(project => project.kind === 'congress')
  const otherProjects = projects.filter(project => project.kind !== 'congress')
  return (
    <div className={styles.home} id="continut" tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="association-title">
        <Image src="/old/3.jpeg" alt="" fill priority sizes="100vw" className={styles.heroPhoto} />
        <div className={styles.heroShade} />
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Asociația Studenților Mediciniști Militari</p>
          <h1 id="association-title">Împreună, dincolo<br className={styles.desktopBreak} /> de amfiteatru.</h1>
          <Link href="#proiecte" className={styles.button}>Descoperă proiectele <FaArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
      <div className={styles.energyBand}><span>Medicină</span><span aria-hidden="true">✳</span><span>Comunitate</span><span aria-hidden="true">✳</span><span>Experiențe</span><span aria-hidden="true">✳</span><span>Împreună</span></div>
      <section data-entrance id="proiecte" aria-labelledby="congress-title" className={styles.feature}>
        <div className={styles.featureCopy}>
          <p className={styles.eyebrow}>Proiectul nostru</p>
          <h2 id="congress-title">{congress?.title || 'MIMESISS'}</h2>
          <p className={styles.lead}>{congress?.summary || 'Congresul științific de medicină militară, organizat de studenți, pentru viitorii medici. Workshopuri practice, conferințe și comunicări științifice.'}</p>
          <Link href="/congres" className={styles.button}>Explorează congresul <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.featureImage}>
          <Image src={congress?.coverImage || '/old/1.jpeg'} alt="Congresul MIMESISS" fill sizes="(max-width: 760px) 100vw, 50vw" className={styles.cover} />
        </div>
      </section>
      {otherProjects.length > 0 && <section className={styles.projects} aria-labelledby="projects-title">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>Implicare, tot anul</p><h2 id="projects-title">Proiectele asociației</h2></div>
          <Link href="/proiecte" className={styles.textLink}>Toate proiectele <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className={styles.projectGrid}>
          {otherProjects.map(project => <Link key={project.slug} href={project.href} className={styles.project}>
            {project.coverImage && <div className={styles.projectImage}><Image src={project.coverImage} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" className={styles.cover} /></div>}
            <p className={styles.projectKicker}>{project.kicker || 'Proiect ASMM'}</p>
            <h3>{project.title}</h3><p>{project.summary}</p>
            <span className={styles.textLink}>Află mai multe <FaArrowRight aria-hidden="true" /></span>
          </Link>)}
        </div>
      </section>}
      <section data-entrance className={styles.about} aria-labelledby="about-title">
        <div><p className={styles.eyebrow}>Despre noi</p><h2 id="about-title">Studenți care învață<br />unii de la alții.</h2></div>
        <div><p>ASMM reunește studenții Institutului Medico-Militar și ai Universității de Medicină și Farmacie „Carol Davila”. Organizăm workshopuri practice, conferințe și concursuri științifice în spitalele și centrele de simulare unde se face medicina militară.</p><Link href="/despre" className={styles.textLink}>Descoperă asociația <FaArrowRight aria-hidden="true" /></Link></div>
      </section>
      <PartnerMarquee />
      <section className={styles.contact} aria-labelledby="contact-title"><div><p className={styles.contactEyebrow}>Hai să vorbim</p><h2 id="contact-title">Ai o idee? Construim împreună.</h2></div><Link href="/contact" className={styles.button}>Contactează-ne <FaArrowRight aria-hidden="true" /></Link></section>
    </div>
  )
}

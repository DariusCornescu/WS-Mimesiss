import Image from 'next/image'
import Link from 'next/link'
import HeaderContent from '@/components/ui/HeaderContent'
import type { ProjectCard, ProjectDoc } from '@/lib/projects'
import styles from './ProjectPages.module.css'

export function ProjectListing({ projects }: { projects: ProjectCard[] }) {
  return <><HeaderContent title="Proiecte și anunțuri" kicker="ASMM · Implicare" /><div className="public-page"><p className="public-intro">Învățăm, organizăm și creștem împreună. Descoperă proiectele și noutățile asociației.</p>{projects.length ? <div className={styles.grid}>{projects.map(project => <article key={project.slug} className={styles.card}><Link href={project.href} className={styles.cardLink}>{project.coverImage ? <Image className={styles.cover} style={{ objectPosition: `${project.coverPositionX ?? 50}% ${project.coverPositionY ?? 50}%` }} src={project.coverImage} alt="" width={800} height={500} /> : <div className={styles.placeholder} aria-hidden="true">ASMM</div>}<div className={styles.copy}><p className={styles.kicker}>{project.kicker || (project.kind === 'announcement' ? 'Anunț ASMM' : 'Proiect ASMM')}</p><h2>{project.title}</h2><p className={styles.summary}>{project.summary}</p><span className={styles.readMore}>{project.kind === 'announcement' ? 'Citește anunțul' : 'Descoperă proiectul'} →</span></div></Link></article>)}</div> : <p className="archive-note">Nicio postare publicată momentan. Revino pentru noutăți sau <Link href="/contact" className="underline">contactează-ne</Link>.</p>}</div></>
}

export function ProjectDetail({ project }: { project: ProjectDoc }) {
  return <><HeaderContent title={project.title} kicker={project.kicker || (project.kind === 'announcement' ? 'Anunț ASMM' : 'Proiect ASMM')} /><div className="public-page"><Link className="public-link mb-8" href="/proiecte">Toate proiectele și anunțurile</Link>{project.coverImage && <Image className="public-photo mb-10" style={{ objectPosition: `${project.coverPositionX ?? 50}% ${project.coverPositionY ?? 50}%` }} src={project.coverImage} alt={project.title} width={1200} height={750} />}<p className="public-intro whitespace-pre-line break-words">{project.summary}</p><div className="max-w-3xl space-y-6 text-lg leading-relaxed">{project.description?.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p className="whitespace-pre-line break-words" key={index}>{paragraph}</p>)}</div><Link href="/contact" className="public-link mt-10">Ia legătura cu noi</Link></div></>
}

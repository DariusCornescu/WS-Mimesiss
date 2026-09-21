import Image from 'next/image'
import Link from 'next/link'
import HeaderContent from '@/components/ui/HeaderContent'
import type { ProjectCard, ProjectDoc } from '@/lib/projects'

export function ProjectListing({ projects }: { projects: ProjectCard[] }) {
  return <><HeaderContent title="Proiectele asociației" kicker="ASMM · Implicare" /><div className="public-page"><p className="public-intro">Învățăm, organizăm și creștem împreună. Descoperă proiectele prin care aducem studenții mai aproape de medicina practicată în echipă.</p>{projects.length ? <div className="public-grid project-list">{projects.map(project => <article key={project.slug} className="public-card"><Link href={project.href}>{project.coverImage && <Image src={project.coverImage} alt="" width={600} height={400} />}<p className="public-kicker">{project.kicker || 'Proiect ASMM'}</p><h2>{project.title}</h2><p>{project.summary}</p><span className="public-link">Descoperă proiectul</span></Link></article>)}</div> : <p className="archive-note">Niciun proiect publicat momentan. Revino pentru noutăți sau <Link href="/contact" className="underline">contactează-ne</Link>.</p>}</div></>
}

export function ProjectDetail({ project }: { project: ProjectDoc }) {
  return <><HeaderContent title={project.title} kicker={project.kicker || 'Proiect ASMM'} /><div className="public-page"><Link className="public-link mb-8" href="/proiecte">Toate proiectele</Link>{project.coverImage && <Image className="public-photo mb-10" src={project.coverImage} alt={project.title} width={1200} height={600} />}<p className="public-intro">{project.summary}</p><div className="max-w-3xl space-y-6 text-lg leading-relaxed">{project.description?.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><Link href="/contact" className="public-link mt-10">Ia legătura cu noi</Link></div></>
}

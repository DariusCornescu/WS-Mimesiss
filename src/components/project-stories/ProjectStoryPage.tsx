import type { ProjectStoryCopy } from '@/lib/project-story-copy'
import type { TentStoryCopy } from '@/lib/tent-story-copy'
import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'
import StoryDesign from './components/StoryDesign'
import { projects, type ProjectId } from './lib/content'
import { storyRoutes } from './lib/routes'
import { PATH_HREF } from '@/lib/path-project'
import { photoDimensions } from './lib/photo-dimensions'
import ProjectGallery from './components/ProjectGallery'
import styles from './ProjectStoryPage.module.css'

/**
 * The three stories plus PATH, in the same order as the site menu. PATH has its
 * own page rather than a story, so it is added here instead of to `projects`.
 */
function projectLinks(): { key: string; href: string; label: string; id?: ProjectId }[] {
  const stories = projects.map(item => ({ key: item.id, href: storyRoutes[item.id], label: item.id === 'cort' ? 'Cortul IMM' : item.title, id: item.id }))
  return [stories[0], { key: 'path', href: PATH_HREF, label: 'PATH' }, ...stories.slice(1)]
}

export default function ProjectStoryPage({ projectId, tentCopy, storyCopy }: { projectId: ProjectId; tentCopy?: TentStoryCopy; storyCopy?: ProjectStoryCopy }) {
  const project = projects.find(item => item.id === projectId)!
  const gallery = project.gallery.map(item => ({ ...item, ...photoDimensions[item.src] }))

  return <div className={styles.page} data-project-story={projectId}>
    <nav className={styles.navigation} aria-label="Alege proiectul">
      {projectLinks().map(item => <Link key={item.key} href={item.href} aria-current={item.id === projectId ? 'page' : undefined}>{item.label}</Link>)}
    </nav>
    <div className={styles.content}>
      <StoryDesign project={project} tentCopy={tentCopy} storyCopy={storyCopy} />
      {projectId === 'mimesiss' && <nav className={styles.congressLinks} aria-label="Participare la congres"><Link href="/congres">Informații despre congres <FiArrowRight aria-hidden="true" /></Link><Link href="/congres/workshops">Ateliere și înscrieri <FiArrowRight aria-hidden="true" /></Link></nav>}
      {projectId !== 'bal' && <section className={styles.gallery} aria-label={'Galerie '+project.title}><div className={styles.galleryHeading}><h2>Galerie</h2><span>{gallery.length} fotografii</span></div><ProjectGallery photos={gallery} title={'Galerie '+project.title} /></section>}
      <nav className={styles.more} aria-label="Alte proiecte">{projectLinks().filter(item => item.id !== projectId).map(item => <Link key={item.key} href={item.href}>{item.label}<FiArrowRight aria-hidden="true" /></Link>)}</nav>
    </div>
  </div>
}

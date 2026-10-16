'use client'

import type { ProjectStoryCopy } from '@/lib/project-story-copy'
import type { TentStoryCopy } from '@/lib/tent-story-copy'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import StoryDesign from './components/StoryDesign'
import { projects, type ProjectId } from './lib/content'
import { storyRoutes } from './lib/routes'
import { photoDimensions } from './lib/photo-dimensions'
import PhotoGrid from '@/components/ui/PhotoGrid'
import { viewerPhotos, type GalleryPhoto } from '@/lib/photo-viewer'
import styles from './ProjectStoryPage.module.css'

const PhotoViewer = dynamic(() => import('@/components/ui/PhotoViewer'), { ssr: false })

export default function ProjectStoryPage({ projectId, tentCopy, storyCopy }: { projectId: ProjectId; tentCopy?: TentStoryCopy; storyCopy?: ProjectStoryCopy }) {
  const project = projects.find(item => item.id === projectId)!
  const [photo, setPhoto] = useState<GalleryPhoto | null>(null)
  const gallery = useMemo(() => project.gallery.map(item => ({ ...item, ...photoDimensions[item.src] })), [project])
  const viewer = useMemo(() => photo ? viewerPhotos(gallery, photo) : null, [gallery, photo])

  return <div className={styles.page} data-project-story={projectId}>
    <nav className={styles.navigation} aria-label="Alege proiectul">
      {projects.map(item => <Link key={item.id} href={storyRoutes[item.id]} aria-current={item.id === projectId ? 'page' : undefined}>{item.id === 'cort' ? 'Cortul IMM' : item.title}</Link>)}
    </nav>
    <div className={styles.content}>
      <StoryDesign project={project} tentCopy={tentCopy} storyCopy={storyCopy} />
      {projectId === 'mimesiss' && <nav className={styles.congressLinks} aria-label="Participare la congres"><Link href="/congres">Informații despre congres <FiArrowRight aria-hidden="true" /></Link><Link href="/congres/workshops">Ateliere și înscrieri <FiArrowRight aria-hidden="true" /></Link></nav>}
      {projectId !== 'bal' && <section className={styles.gallery} aria-label={'Galerie '+project.title}><div className={styles.galleryHeading}><h2>Galerie</h2><span>{gallery.length} fotografii</span></div><PhotoGrid photos={gallery} onSelect={item => setPhoto(item)} /></section>}
      <nav className={styles.more} aria-label="Alte proiecte">{projects.filter(item => item.id !== projectId).map(item => <Link key={item.id} href={storyRoutes[item.id]}>{item.id === 'cort' ? 'Cortul IMM' : item.title}<FiArrowRight aria-hidden="true" /></Link>)}</nav>
    </div>
    {viewer && <PhotoViewer photos={viewer.photos} index={viewer.index} title={'Galerie '+project.title} onClose={() => setPhoto(null)} />}
  </div>
}

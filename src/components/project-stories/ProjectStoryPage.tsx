'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi'
import StoryDesign from './components/StoryDesign'
import { projects, type ProjectId } from './lib/content'
import { storyRoutes } from './lib/routes'
import { photoDimensions } from './lib/photo-dimensions'
import { usePhotoSwipe } from './lib/usePhotoSwipe'
import styles from './ProjectStoryPage.module.css'

export default function ProjectStoryPage({ projectId }: { projectId: ProjectId }) {
  const project = projects.find(item => item.id === projectId)!
  const [photo, setPhoto] = useState<{ src: string; alt: string } | null>(null)
  const photoOpen = photo !== null
  const photoIndex = photo ? project.gallery.findIndex(item => item.src === photo.src) : -1
  const movePhoto = (direction: number) => { if (photoIndex >= 0) setPhoto(project.gallery[(photoIndex + direction + project.gallery.length) % project.gallery.length]) }
  const swipe = usePhotoSwipe({ onNext: () => movePhoto(1), onPrevious: () => movePhoto(-1) })
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!photoOpen || !dialogRef.current) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (!dialogRef.current.open) dialogRef.current.showModal()
    return () => { document.body.style.overflow = previous }
  }, [photoOpen])

  return <div className={styles.page} data-project-story={projectId}>
    <nav className={styles.navigation} aria-label="Alege proiectul">
      {projects.map(item => <Link key={item.id} href={storyRoutes[item.id]} aria-current={item.id === projectId ? 'page' : undefined}>{item.id === 'cort' ? 'Cortul IMM' : item.title}</Link>)}
    </nav>
    <div className={styles.content}>
      <StoryDesign project={project} onOpenImage={(src, alt) => setPhoto({ src, alt })} />
      {projectId === 'mimesiss' && <nav className={styles.congressLinks} aria-label="Participare la congres"><Link href="/congres">Informații despre congres <FiArrowRight aria-hidden="true" /></Link><Link href="/congres/workshops">Ateliere și înscrieri <FiArrowRight aria-hidden="true" /></Link></nav>}
      {projectId !== 'bal' && <section className={styles.gallery} aria-label={`Galerie ${project.title}`}><h2>Galerie</h2><div className={styles.grid}>{project.gallery.map(item => <button key={item.src} type="button" onClick={() => setPhoto(item)} aria-label={`Mărește fotografia: ${item.alt}`}><Image src={item.src} alt={item.alt} width={photoDimensions[item.src].width} height={photoDimensions[item.src].height} style={{ aspectRatio: `${photoDimensions[item.src].width} / ${photoDimensions[item.src].height}` }} sizes="(max-width: 700px) calc(100vw - 32px), 33vw" /></button>)}</div></section>}
      <nav className={styles.more} aria-label="Alte proiecte">{projects.filter(item => item.id !== projectId).map(item => <Link key={item.id} href={storyRoutes[item.id]}>{item.id === 'cort' ? 'Cortul IMM' : item.title}<FiArrowRight aria-hidden="true" /></Link>)}</nav>
    </div>
    <dialog ref={dialogRef} className={styles.dialog} aria-label="Fotografie mărită" onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); movePhoto(event.key === 'ArrowRight' ? 1 : -1) } }} onCancel={() => setPhoto(null)} onClose={() => setPhoto(null)} onClick={event => { if (event.target === event.currentTarget) { dialogRef.current?.close(); setPhoto(null) } }}>
      <button className={styles.close} type="button" aria-label="Închide fotografia" onClick={() => { dialogRef.current?.close(); setPhoto(null) }}><FiX aria-hidden="true" /></button>
      {photo && <Image {...swipe} src={photo.src} alt={photo.alt} width={photoDimensions[photo.src]?.width ?? 2400} height={photoDimensions[photo.src]?.height ?? 1800} unoptimized draggable={false} />}
      {photoIndex >= 0 && <div className={styles.photoControls}>
        <button type="button" aria-label="Fotografia anterioară" onClick={() => movePhoto(-1)}><FiChevronLeft aria-hidden="true" /></button>
        <span aria-live="polite">{photoIndex + 1} / {project.gallery.length}</span>
        <button type="button" aria-label="Fotografia următoare" onClick={() => movePhoto(1)}><FiChevronRight aria-hidden="true" /></button>
      </div>}
    </dialog>
  </div>
}

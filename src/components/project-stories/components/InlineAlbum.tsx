'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay, FiZoomIn } from 'react-icons/fi'
import type { StoryProject } from '../lib/content'
import { usePhotoSwipe } from '../lib/usePhotoSwipe'
import { photoDimensions } from '../lib/photo-dimensions'
import styles from './InlineAlbum.module.css'

export default function InlineAlbum({ photos, onOpenImage }: { photos: StoryProject['gallery']; onOpenImage: (src: string, alt: string) => void }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [visible, setVisible] = useState(false)
  const [interacting, setInteracting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const swipe = usePhotoSwipe({
    onNext: () => { setIndex(value => (value + 1) % photos.length); setPlaying(false) },
    onPrevious: () => { setIndex(value => (value - 1 + photos.length) % photos.length); setPlaying(false) },
  })
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => { if (preference.matches) setPlaying(false) }
    apply()
    preference.addEventListener('change', apply)
    const observer = new IntersectionObserver(entries => setVisible(entries[0]?.isIntersecting ?? false), { threshold: .2 })
    if (ref.current) observer.observe(ref.current)
    return () => { observer.disconnect(); preference.removeEventListener('change', apply) }
  }, [])
  useEffect(() => {
    if (!playing || !visible || interacting) return
    const timer = setInterval(() => setIndex(value => (value + 1) % photos.length), 4200)
    return () => clearInterval(timer)
  }, [playing, visible, interacting, photos.length])
  const photo = photos[index]
  return <div ref={ref} className={styles.album} data-playing={playing} data-in-view={visible} data-interacting={interacting} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false) }} aria-label="Momente de la Balul bobocilor">
    <button {...swipe} className={styles.photo} type="button" onClick={() => onOpenImage(photo.src, photo.alt)} aria-label={`Mărește fotografia: ${photo.alt}`}><Image src={photo.src} alt={photo.alt} width={photoDimensions[photo.src].width} height={photoDimensions[photo.src].height} quality={85} sizes="(max-width: 700px) 100vw, 80vw" draggable={false} /><span><FiZoomIn aria-hidden="true" /> Vezi momentul</span></button>
    <div className={styles.captionSpace} aria-hidden="true" />
    <div className={styles.controls}>
      <button type="button" aria-label="Momentul anterior" onClick={() => setIndex(value => (value - 1 + photos.length) % photos.length)}><FiChevronLeft aria-hidden="true" /></button>
      <span aria-live={playing ? 'off' : 'polite'}>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
      <button type="button" aria-label="Momentul următor" onClick={() => setIndex(value => (value + 1) % photos.length)}><FiChevronRight aria-hidden="true" /></button>
      <button type="button" className={styles.play} aria-label={playing ? 'Oprește slideshow-ul balului' : 'Pornește slideshow-ul balului'} aria-pressed={playing} onClick={() => { setPlaying(value => !value); setInteracting(false) }}>{playing ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}{playing ? 'Pauză' : 'Redă'}</button>
    </div>
  </div>
}

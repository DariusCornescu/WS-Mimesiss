'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { FiArrowDown, FiArrowRight, FiMaximize2 } from 'react-icons/fi'
import { projects, statement } from '../lib/content'
import { mimesissScenePhotos } from '../lib/mimesiss-scene'
import type { NeuralSpace } from '../lib/neural-space'
import styles from './MimesissScrollStory.module.css'

const project = projects.find(item => item.id === 'mimesiss')!
const conference = project.sections?.find(section => section.title === 'Conferințe')
const sentences = conference?.description.split(/(?<=\.)\s+/) ?? project.description
const chapters = [
  { label: 'Conferințe', title: conference?.subtitle ?? 'Idei care deschid noi perspective', body: sentences[0] },
  { label: 'Participanți', title: '', body: project.description[1] },
  { label: 'Perspective', title: '', body: sentences.slice(1).join(' ') },
  { label: 'Împreună', title: '', body: statement },
]
const stops = [.25, .49, .73, .96]
const arrivals = [.19, .43, .67, .9]
const departures = [.31, .55, .79, 1.1]
const introLogo = { src: '/project-stories/neural-space/mimesiss-intro-logo.png', alt: 'MIMESISS, ediția a V-a — Military Medicine Scientific Session for Students.' }
const clamp = (value: number) => Math.min(1, Math.max(0, value))
const between = (value: number, start: number, end: number) => clamp((value - start) / (end - start))

export default function MimesissScrollStory({ onOpenImage }: { onOpenImage: (src: string, alt: string) => void }) {
  const trackRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const spaceRef = useRef<NeuralSpace | null>(null)
  const renderRef = useRef<() => void>(() => {})
  const introRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const photoRefs = useRef<(HTMLButtonElement | null)[]>([])
  const jumpRefs = useRef<(HTMLButtonElement | null)[]>([])
  const progressRef = useRef<HTMLSpanElement>(null)
  const introLogoActiveRef = useRef(true)
  const [automaticStatic, setAutomaticStatic] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [sceneError, setSceneError] = useState<string | null>(null)
  const staticMode = automaticStatic || sceneError !== null

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => { setAutomaticStatic(preference.matches); setSceneReady(false) }
    sync()
    preference.addEventListener('change', sync)
    return () => preference.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const host = worldRef.current
    if (staticMode || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelled = false
    let controller: NeuralSpace | null = null
    const fail = () => { if (!cancelled) setSceneError('Scena 3D nu a putut fi afișată. Poți explora fotografiile și textele în prezentarea de mai jos.') }
    import('../lib/neural-space').then(module => module.createNeuralSpace(host, photoRefs.current, fail)).then(space => {
      if (cancelled) { space.dispose(); return }
      controller = space
      spaceRef.current = space
      setSceneReady(true)
      renderRef.current()
    }).catch(fail)
    return () => { cancelled = true; controller?.dispose(); if (spaceRef.current === controller) spaceRef.current = null }
  }, [staticMode])

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    const world = worldRef.current
    if (!track || !stage || !world) return
    let frame = 0
    let previousLayout: { width: number; height: number; progress: number; pinned: boolean } | null = null
    const draw = () => {
      frame = 0
      if (staticMode) {
        if (introRef.current) introRef.current.style.opacity = '1'
        panelRefs.current.forEach(panel => {
          if (!panel) return
          panel.style.opacity = '1'
          panel.style.transform = ''
          panel.inert = false
          panel.removeAttribute('aria-hidden')
        })
        jumpRefs.current.forEach(button => button?.removeAttribute('aria-current'))
        return
      }
      const width = stage.clientWidth
      const height = stage.clientHeight
      const narrow = window.matchMedia('(max-width: 700px)').matches
      const landscape = width <= 1000 && width > height && height <= 500
      const travel = Math.max(1, track.offsetHeight - stage.offsetHeight)
      let progress = clamp(-track.getBoundingClientRect().top / travel)
      if (previousLayout?.pinned && (previousLayout.width !== width || previousLayout.height !== height)) {
        window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top + travel * previousLayout.progress, behavior: 'instant' })
        progress = previousLayout.progress
      }
      const panelHeight = Math.max(...panelRefs.current.map(panel => panel?.offsetHeight ?? 0))
      const stageBounds = stage.getBoundingClientRect()
      const trackBounds = track.getBoundingClientRect()
      previousLayout = { width, height, progress, pinned: trackBounds.top <= 0 && trackBounds.bottom >= height }
      const introBottom = (introRef.current?.offsetTop ?? 0) + (introRef.current?.offsetHeight ?? 0)
      if (stageBounds.bottom > 0 && stageBounds.top < window.innerHeight) spaceRef.current?.update(progress, { width, height, narrow: narrow && !landscape, landscape, panelHeight, introBottom })
      stage.style.setProperty('--photo-label-opacity', String(1 - between(progress, .035, .11)))
      introLogoActiveRef.current = progress < .11
      const firstPhoto = photoRefs.current[0]
      firstPhoto?.setAttribute('aria-label', introLogoActiveRef.current ? 'Mărește sigla MIMESISS' : `Mărește fotografia: ${mimesissScenePhotos[0].alt}`)
      const firstLabel = firstPhoto?.querySelector('[data-photo-label]')
      if (firstLabel) firstLabel.textContent = introLogoActiveRef.current ? 'MIMESISS' : chapters[0].label
      if (introRef.current) introRef.current.style.opacity = String(1 - between(progress, .035, .11))
      panelRefs.current.forEach((panel, index) => {
        if (!panel) return
        const opacity = between(progress, arrivals[index], arrivals[index] + .045) * (1 - between(progress, departures[index], departures[index] + .04))
        panel.style.opacity = String(opacity)
        panel.style.transform = `translateY(${((1 - opacity) * 18).toFixed(1)}px)`
        panel.inert = opacity < .85
        panel.setAttribute('aria-hidden', String(opacity < .1))
      })
      const activeIndex = progress < .13 ? -1 : stops.reduce((nearest, stop, index) => Math.abs(stop - progress) < Math.abs(stops[nearest] - progress) ? index : nearest, 0)
      jumpRefs.current.forEach((button, index) => { if (index === activeIndex) button?.setAttribute('aria-current', 'step'); else button?.removeAttribute('aria-current') })
      photoRefs.current.forEach((button, index) => { if (button) button.tabIndex = activeIndex < 0 || activeIndex === index ? 0 : -1 })
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress.toFixed(3)})`
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(draw) }
    renderRef.current = schedule
    const observer = new ResizeObserver(schedule)
    observer.observe(stage)
    if (introRef.current) observer.observe(introRef.current)
    panelRefs.current.forEach(panel => { if (panel) observer.observe(panel) })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    draw()
    return () => { renderRef.current = () => {}; observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); if (frame) window.cancelAnimationFrame(frame) }
  }, [staticMode])

  const jumpTo = (index: number) => {
    if (staticMode) { panelRefs.current[index]?.scrollIntoView({ behavior: 'instant', block: 'start' }); return }
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return
    window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top + (track.offsetHeight - stage.offsetHeight) * stops[index], behavior: 'smooth' })
  }

  return <section ref={trackRef} className={`${styles.track} ${staticMode ? styles.staticMode : ''}`} aria-labelledby="mimesiss-scroll-title">
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.backdrop} aria-hidden="true"><Image src="/project-stories/neural-space/concept.webp" alt="" width={1586} height={992} sizes="100vw" quality={85} loading="eager" fetchPriority="high" className={`${styles.ambient} ${sceneReady && !staticMode ? styles.loadedBackdrop : ''}`} /></div>
      <div ref={worldRef} className={styles.world} aria-hidden="true" />
      <div className={styles.photoTargets} aria-label="Fotografii din congres">
        {mimesissScenePhotos.map((photo, index) => <button key={photo.src} ref={element => { photoRefs.current[index] = element }} className={styles.scenePhoto} type="button" onClick={() => { const selected = index === 0 && introLogoActiveRef.current ? introLogo : photo; onOpenImage(selected.src, selected.alt) }} aria-label={index === 0 ? 'Mărește sigla MIMESISS' : `Mărește fotografia: ${photo.alt}`}><span><FiMaximize2 aria-hidden="true" /><span data-photo-label>{index === 0 ? 'MIMESISS' : chapters[index].label}</span></span></button>)}
      </div>
      <div ref={introRef} className={styles.intro}>
        <p className={styles.eyebrow}>{project.kicker}</p>
        <h1 id="mimesiss-scroll-title">MIMESISS</h1>
        <p className={styles.tagline}><span>Cunoașterea ne formează, </span><span>experiența ne definește, iar medicina ne unește.</span></p>
        <p className={styles.scrollPrompt}><FiArrowDown aria-hidden="true" />Descoperă prin scroll</p>
      </div>
      {sceneError && <p className={styles.sceneError} role="status">{sceneError}</p>}
      {chapters.map((chapter, index) => <div key={chapter.label} ref={element => { panelRefs.current[index] = element }} className={styles.copyPanel} aria-hidden={!staticMode} inert={!staticMode}>
        <button className={styles.staticPhoto} type="button" onClick={() => onOpenImage(mimesissScenePhotos[index].src, mimesissScenePhotos[index].alt)} aria-label={`Mărește fotografia: ${mimesissScenePhotos[index].alt}`}><Image src={mimesissScenePhotos[index].src} alt={mimesissScenePhotos[index].alt} width={mimesissScenePhotos[index].width} height={mimesissScenePhotos[index].height} unoptimized /></button>
        <p className={styles.eyebrow}>{String(index + 1).padStart(2, '0')} · {chapter.label}</p>
        {chapter.title ? <h2>{chapter.title}</h2> : <div className={styles.titleSpace} aria-hidden="true" />}
        <p className={styles.chapterBody}>{chapter.body}</p>
        <button type="button" className={styles.viewPhoto} onClick={() => onOpenImage(mimesissScenePhotos[index].src, mimesissScenePhotos[index].alt)}>Vezi fotografia <FiArrowRight aria-hidden="true" /></button>
      </div>)}
      <nav className={styles.chapters} aria-label="Momente din MIMESISS">{chapters.map((chapter, index) => <button key={chapter.label} ref={element => { jumpRefs.current[index] = element }} type="button" onClick={() => jumpTo(index)} aria-label={`Mergi la ${chapter.label}`}><span>{String(index + 1).padStart(2, '0')}</span><span>{chapter.label}</span></button>)}</nav>
      <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
    </div>
  </section>
}

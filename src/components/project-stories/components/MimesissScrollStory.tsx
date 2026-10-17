'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowDown } from 'react-icons/fi'
import type { CSSProperties } from 'react'
import { neuralStoryPassages } from '../lib/neural-story-copy'
import { mimesissScenePhotos } from '../lib/mimesiss-scene'
import { mobileStoryFrame, mobileStoryMoments } from '../lib/mobile-story-timing'
import { afterScenePaint } from '../lib/neural-loading'
import type { NeuralSpace } from '../lib/neural-space'
import styles from './MimesissScrollStory.module.css'

const stops = [.25, .49, .73, .96]
const arrivals = [.19, .43, .67, .9]
const departures = [.31, .55, .79, 1.1]
const clamp = (value: number) => Math.min(1, Math.max(0, value))
const between = (value: number, start: number, end: number) => clamp((value - start) / (end - start))

export default function MimesissScrollStory({ chapters, kicker }: { chapters: { label: string; title: string; body: string }[]; kicker: string }) {
  const mobilePassages = useMemo(() => chapters.flatMap((chapter, chapterIndex) => {
    const parts = neuralStoryPassages(chapter, true)
    return parts.map((copy, part) => ({ ...chapter, ...copy, chapterIndex, part, parts: parts.length }))
  }), [chapters])
  const desktopPassages = useMemo(() => chapters.flatMap((chapter, chapterIndex) => {
    const parts = neuralStoryPassages(chapter, false)
    return parts.map((copy, part) => ({ ...chapter, ...copy, chapterIndex, part, parts: parts.length }))
  }), [chapters])
  const mobileMoments = useMemo(() => mobileStoryMoments(mobilePassages.map(passage => passage.chapterIndex)), [mobilePassages])
  const trackRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const spaceRef = useRef<NeuralSpace | null>(null)
  const renderRef = useRef<() => void>(() => {})
  const introRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<(HTMLDivElement | null)[]>([])
  const mobilePanelRefs = useRef<(HTMLDivElement | null)[]>([])
  const progressRef = useRef<HTMLSpanElement>(null)
  const [automaticStatic, setAutomaticStatic] = useState(false)
  const [sceneError, setSceneError] = useState<string | null>(null)
  const staticMode = automaticStatic || sceneError !== null

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => { setAutomaticStatic(preference.matches) }
    sync()
    preference.addEventListener('change', sync)
    return () => preference.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const host = worldRef.current
    if (staticMode || !host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cancelled = false
    const abort = new AbortController()
    let controller: NeuralSpace | null = null
    const fail = () => { if (!cancelled) setSceneError('Scena 3D nu a putut fi afișată. Poți explora fotografiile și textele în prezentarea de mai jos.') }
    const start = () => afterScenePaint(abort.signal).then(() => import('../lib/neural-space')).then(module => module.createNeuralSpace(host, fail, abort.signal, () => renderRef.current())).then(space => {
      if (cancelled) { space.dispose(); return }
      controller = space
      spaceRef.current = space
      renderRef.current()
    }).catch(fail)
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      void start()
    }, { rootMargin: '240px' })
    observer.observe(host)
    return () => { cancelled = true; observer.disconnect(); abort.abort(); controller?.dispose(); if (spaceRef.current === controller) spaceRef.current = null }
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
        return
      }
      const width = stage.clientWidth
      const height = stage.clientHeight
      const narrow = window.matchMedia('(max-width: 700px)').matches
      const landscape = width <= 1000 && width > height && height <= 500
      const reading = window.matchMedia('(max-width: 700px), (max-width: 1000px) and (max-height: 500px)').matches
      const travel = Math.max(1, track.offsetHeight - stage.offsetHeight)
      let progress = clamp(-track.getBoundingClientRect().top / travel)
      if (!reading && previousLayout?.pinned && (previousLayout.width !== width || previousLayout.height !== height)) {
        window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top + travel * previousLayout.progress, behavior: 'instant' })
        progress = previousLayout.progress
      }
      if (reading) {
        const mobile = mobileStoryFrame(clamp((64 - track.getBoundingClientRect().top) / travel), mobileMoments, stops)
        progress = mobile.progress
        mobilePanelRefs.current.forEach((panel, index) => {
          if (!panel) return
          const opacity = mobile.opacities[index]
          panel.style.opacity = String(opacity)
          panel.inert = opacity < .85
          panel.setAttribute('aria-hidden', String(opacity < .1))
        })
      }
      const panelHeight = Math.max(...(reading ? mobilePanelRefs : panelRefs).current.map(panel => panel?.offsetHeight ?? 0))
      const stageBounds = stage.getBoundingClientRect()
      const trackBounds = track.getBoundingClientRect()
      previousLayout = { width, height, progress, pinned: trackBounds.top <= 0 && trackBounds.bottom >= height }
      const introBottom = (introRef.current?.offsetTop ?? 0) + (introRef.current?.offsetHeight ?? 0)
      const visible = document.visibilityState === 'visible' && stageBounds.bottom > 0 && stageBounds.top < window.innerHeight
      const visualReady = visible && spaceRef.current?.update(progress, { width, height, narrow: narrow && !landscape, landscape, panelHeight, introBottom })
      if (!visualReady) mobilePanelRefs.current.forEach(panel => {
        if (!panel) return
        panel.style.opacity = '0'
        panel.inert = true
        panel.setAttribute('aria-hidden', 'true')
      })
      if (introRef.current) introRef.current.style.opacity = String(1 - between(progress, .035, .11))
      panelRefs.current.forEach((panel, index) => {
        if (!panel) return
        const passage = desktopPassages[index]
        const start = arrivals[passage.chapterIndex]
        const end = Math.min(1.04, departures[passage.chapterIndex] + .04)
        const partSpan = (end - start) / passage.parts
        const partStart = start + passage.part * partSpan
        const fade = Math.min(.035, partSpan * .2)
        const opacity = reading || !visualReady ? 0 : between(progress, partStart, partStart + fade) * (1 - between(progress, partStart + partSpan - fade, partStart + partSpan))
        panel.style.opacity = String(opacity)
        panel.style.transform = `translateY(${((1 - opacity) * 18).toFixed(1)}px)`
        panel.inert = opacity < .85
        panel.setAttribute('aria-hidden', String(opacity < .1))
      })
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress.toFixed(3)})`
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(draw) }
    renderRef.current = schedule
    const observer = new ResizeObserver(schedule)
    observer.observe(stage)
    mobilePanelRefs.current.forEach(panel => { if (panel) observer.observe(panel) })
    if (introRef.current) observer.observe(introRef.current)
    panelRefs.current.forEach(panel => { if (panel) observer.observe(panel) })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    document.addEventListener('visibilitychange', schedule)
    draw()
    return () => { renderRef.current = () => {}; observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); document.removeEventListener('visibilitychange', schedule); if (frame) window.cancelAnimationFrame(frame) }
  }, [staticMode, desktopPassages, mobileMoments])

  return <section ref={trackRef} style={{ '--story-passage-count': mobilePassages.length } as CSSProperties} className={`${styles.track} ${staticMode ? styles.staticMode : ''}`} aria-labelledby="mimesiss-scroll-title">
    <div ref={stageRef} className={styles.stage}>
      <div ref={worldRef} className={styles.world} aria-hidden="true" />
      <picture className={styles.poster}>
        <source media="(max-width: 700px) and (orientation: portrait)" srcSet="/project-stories/neural-space/intro-mobile.webp" />
        <Image src="/project-stories/neural-space/intro-desktop.webp" alt="" fill unoptimized loading="eager" fetchPriority="high" />
      </picture>
      <div ref={introRef} className={styles.intro}>
        <p className={styles.eyebrow}>{kicker}</p>
        <h1 id="mimesiss-scroll-title">MIMESISS</h1>
        <p className={styles.fullName}>Military Medicine Scientific Session for Students</p>
        <p className={styles.tagline}><span>Cunoașterea ne formează, </span><span>experiența ne definește, iar medicina ne unește.</span></p>
        <p className={styles.scrollPrompt}><FiArrowDown aria-hidden="true" />Descoperă prin scroll</p>
      </div>
      {sceneError && <p className={styles.sceneError} role="status">{sceneError}</p>}
      {(staticMode ? chapters.map((chapter, chapterIndex) => ({ ...chapter, chapterIndex })) : desktopPassages).map((chapter, index) => <div key={index} ref={element => { panelRefs.current[index] = element }} className={styles.copyPanel} data-empty={!chapter.title && !chapter.body} aria-hidden={!staticMode} inert={!staticMode}>
        <figure className={styles.staticPhoto}><Image src={mimesissScenePhotos[chapter.chapterIndex].src} alt={mimesissScenePhotos[chapter.chapterIndex].alt} width={mimesissScenePhotos[chapter.chapterIndex].width} height={mimesissScenePhotos[chapter.chapterIndex].height} unoptimized /></figure>
        <p className={styles.eyebrow}>{chapter.label}</p>
        {chapter.title && <h2>{chapter.title}</h2>}
        <p className={styles.chapterBody}>{chapter.body}</p>
      </div>)}
      {mobilePassages.map((passage, index) => <div key={index} ref={element => { mobilePanelRefs.current[index] = element }} className={styles.mobilePanel} data-empty={!passage.title && !passage.body} aria-hidden inert>
        <p className={styles.eyebrow}>{passage.label}</p>
        {passage.title && <h2>{passage.title}</h2>}
        <p className={styles.chapterBody}>{passage.body}</p>
      </div>)}
      <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
    </div>
  </section>
}

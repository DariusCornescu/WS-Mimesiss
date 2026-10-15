'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { CSSProperties } from 'react'
import { FiArrowDown, FiArrowRight, FiMaximize2 } from 'react-icons/fi'
import type { EventStory } from '../lib/event-stories'
import styles from './EventScrollStory.module.css'

const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }
const stops = [0, .22, .46, .7, .94]
const subscribeToMotion = (onChange: () => void) => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}
const motionSnapshot = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduced' : 'animated'
const serverMotionSnapshot = () => 'animated'

export default function EventScrollStory({ story, onOpenImage }: { story: EventStory; onOpenImage: (src: string, alt: string) => void }) {
  const trackRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRefs = useRef<(HTMLElement | null)[]>([])
  const jumpRefs = useRef<(HTMLButtonElement | null)[]>([])
  const progressRef = useRef<HTMLSpanElement>(null)
  const [loadedThrough, setLoadedThrough] = useState(1)
  const loadedThroughRef = useRef(1)
  const motion = useSyncExternalStore(subscribeToMotion, motionSnapshot, serverMotionSnapshot)
  const reducedMotion = motion === 'reduced'
  const animated = !reducedMotion
  const frames = [
    { label: 'Început', title: story.title, body: story.subtitle, photo: story.intro },
    ...story.chapters,
  ]

  useEffect(() => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return
    if (!animated) {
      frameRefs.current.forEach(frame => {
        if (!frame) return
        frame.style.removeProperty('opacity')
        frame.style.removeProperty('visibility')
        frame.style.removeProperty('z-index')
        frame.inert = false
        frame.removeAttribute('aria-hidden')
      })
      return
    }
    let raf = 0
    let previous: { width: number; height: number; progress: number; pinned: boolean } | null = null
    const draw = () => {
      raf = 0
      const reading = window.matchMedia('(max-width: 700px), (max-width: 1000px) and (max-height: 500px)').matches
      if (reading) {
        let active = 0
        frameRefs.current.forEach((frame, index) => {
          if (!frame) return
          const bounds = frame.getBoundingClientRect()
          if (bounds.top < window.innerHeight * .5) active = index
          frame.style.opacity = '1'
          frame.style.visibility = 'visible'
          frame.style.removeProperty('z-index')
          frame.inert = false
          frame.removeAttribute('aria-hidden')
          const visible = bounds.bottom > 64 && bounds.top < window.innerHeight
          frame.dataset.visible = String(visible)
          const amount = clamp((window.innerHeight - bounds.top) / (window.innerHeight + bounds.height))
          frame.style.setProperty('--photo-scale', String(1 + amount * .035))
          frame.style.setProperty('--photo-x', '0%')
          frame.style.setProperty('--photo-y', '0%')
          frame.style.setProperty('--photo-turn', '0deg')
          frame.style.setProperty('--copy-y', '0px')
        })
        const next = Math.min(frames.length - 1, active + 1)
        if (next > loadedThroughRef.current) { loadedThroughRef.current = next; setLoadedThrough(next) }
        stage.dataset.activeChapter = String(active)
        jumpRefs.current.forEach((button, index) => { if (index + 1 === active) button?.setAttribute('aria-current', 'step'); else button?.removeAttribute('aria-current') })
        return
      }
      const bounds = track.getBoundingClientRect()
      const height = stage.clientHeight
      const width = stage.clientWidth
      const travel = Math.max(1, track.offsetHeight - height)
      let progress = clamp(-bounds.top / travel)
      if (previous?.pinned && (previous.width !== width || previous.height !== height)) {
        progress = previous.progress
        window.scrollTo({ top: window.scrollY + bounds.top + progress * travel, behavior: 'instant' })
      }
      previous = { width, height, progress, pinned: bounds.top <= 0 && bounds.bottom >= height }
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return
      const narrow = width < 700
      let index = stops.findLastIndex(stop => progress >= stop)
      index = Math.max(0, index)
      const span = (stops[index + 1] ?? 1.2) - stops[index]
      const segment = clamp((progress - stops[index]) / span)
      const transition = index < frames.length - 1 ? smooth((segment - .55) / .45) : 0
      const active = transition >= .5 ? index + 1 : index
      stage.dataset.activeChapter = String(active)
      stage.dataset.progress = progress.toFixed(4)
      // A moving gradient repaints the whole screen; keep it stationary on phones.
      if (!narrow) stage.style.setProperty('--spot-shift', `${(progress * 18).toFixed(2)}%`)
      const preloadThrough = Math.min(frames.length - 1, index + (progress > .08 ? 2 : 1))
      if (preloadThrough > loadedThroughRef.current) {
        loadedThroughRef.current = preloadThrough
        setLoadedThrough(preloadThrough)
      }
      frameRefs.current.forEach((frame, frameIndex) => {
        if (!frame) return
        const outgoing = frameIndex === index
        const incoming = frameIndex === index + 1
        const opacity = outgoing ? 1 - transition : incoming ? transition : 0
        const motion = outgoing ? segment : incoming ? transition - 1 : 0
        frame.style.opacity = String(opacity)
        frame.style.visibility = opacity > .001 ? 'visible' : 'hidden'
        frame.dataset.visible = String(opacity > .001)
        frame.style.zIndex = frameIndex === active ? '2' : '1'
        frame.style.setProperty('--photo-scale', String(1 + (outgoing ? segment * (narrow ? .035 : .075) : (transition - 1) * .06)))
        frame.style.setProperty('--photo-x', `${story.id === 'cort' ? -motion * (narrow ? 5 : 14) : motion * -1.8}%`)
        frame.style.setProperty('--photo-y', `${story.id === 'bal' ? -motion * (narrow ? 1 : 3) : 0}%`)
        frame.style.setProperty('--photo-turn', `${story.id === 'cort' && !narrow ? motion * -3 : 0}deg`)
        frame.style.setProperty('--copy-y', `${outgoing ? -transition * 18 : (1 - transition) * 24}px`)
        frame.inert = frameIndex !== active
        frame.setAttribute('aria-hidden', String(frameIndex !== active))
      })
      jumpRefs.current.forEach((button, chapterIndex) => {
        if (chapterIndex + 1 === active) button?.setAttribute('aria-current', 'step')
        else button?.removeAttribute('aria-current')
      })
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw) }
    const resize = new ResizeObserver(schedule)
    resize.observe(stage)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    draw()
    return () => { resize.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); if (raf) cancelAnimationFrame(raf) }
  }, [animated, story.id, frames.length])

  const jumpTo = (index: number) => {
    const track = trackRef.current
    const stage = stageRef.current
    if (!track || !stage) return
    if (!animated || window.matchMedia('(max-width: 700px), (max-width: 1000px) and (max-height: 500px)').matches) { frameRefs.current[index]?.scrollIntoView({ behavior: 'instant', block: 'start' }); return }
    const preloadThrough = Math.min(frames.length - 1, index + 1)
    if (preloadThrough > loadedThroughRef.current) {
      loadedThroughRef.current = preloadThrough
      setLoadedThrough(preloadThrough)
    }
    const target = stops[index] + .025
    window.scrollTo({ top: window.scrollY + track.getBoundingClientRect().top + (track.offsetHeight - stage.offsetHeight) * target, behavior: 'smooth' })
  }

  return <section id={`${story.id}-story`} ref={trackRef} data-event-story={story.id} className={`${styles.track} ${styles[story.id]} ${animated ? styles.animated : styles.staticMode}`} aria-labelledby={`${story.id}-story-title`}>
    <noscript><style>{`
      .${styles.track} { height: auto; }
      .${styles.stage} { position: relative; height: auto; padding: 80px 5% 30px; }
      .${styles.frame} { position: relative; opacity: 1 !important; visibility: visible !important; margin-bottom: 48px; }
      .${styles.track} .${styles.visual} { position: relative; inset: auto; height: auto; aspect-ratio: 4 / 3; transform: none; }
      .${styles.visual} img { object-fit: contain; }
      .${styles.track} .${styles.copy} { position: relative; inset: auto; width: auto; max-height: none; transform: none; }
      .${styles.ambient}, .${styles.lighting}, .${styles.imageShade}, .${styles.largeNumber}, .${styles.chapters}, .${styles.explore} { display: none; }
    `}</style></noscript>
    <div ref={stageRef} className={styles.stage}>
      <div className={styles.stageHeader}>
        <span className={styles.signature}>ASMM <span>/</span> {story.title}</span>
        <div className={styles.tools}>
          <a href="#story-overview" aria-label="Sari peste poveste">Sari peste <FiArrowDown aria-hidden="true" /></a>
        </div>
      </div>

      {frames.map((frame, index) => <article key={`${index}-${frame.photo.src}`} id={`${story.id}-moment-${index}`} ref={element => { frameRefs.current[index] = element }} className={`${styles.frame} ${index === 0 ? styles.intro : ''}`} aria-label={index === 0 ? story.title : frame.label}>
        <div className={styles.ambient} aria-hidden="true">{(index <= loadedThrough || reducedMotion) && <Image src={frame.photo.src} alt="" fill quality={40} sizes="256px" loading={index === 0 ? 'eager' : 'lazy'} style={{ objectPosition: frame.photo.position }} />}</div>
        <div className={styles.visual} style={{ '--photo-ratio': `${frame.photo.width} / ${frame.photo.height}` } as CSSProperties}>
          {(index <= loadedThrough || reducedMotion) ? <Image src={frame.photo.src} alt={frame.photo.alt} fill quality={85} sizes="100vw" loading={index <= loadedThrough ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'low'} draggable={false} style={{ objectPosition: frame.photo.position } as CSSProperties} /> : <noscript><Image src={frame.photo.src} alt={frame.photo.alt} fill quality={85} sizes="100vw" style={{ objectPosition: frame.photo.position }} /></noscript>}
          <div className={styles.imageShade} aria-hidden="true" />
        </div>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>{index === 0 ? story.eyebrow : `${story.id === 'bal' ? 'Momentul' : 'Oprirea'} ${String(index).padStart(2, '0')} / ${frame.label}`}</p>
          {index === 0 ? <h1 id={`${story.id}-story-title`}>{story.id === 'bal' ? <>Balul<br /><em>bobocilor.</em></> : <>Cortul <em>IMM.</em></>}</h1> : frame.title ? <h2>{frame.title}</h2> : <div className={styles.titleSpace} aria-hidden="true" />}
          {frame.body ? <p className={styles.body}>{frame.body}</p> : <div className={styles.bodySpace} aria-hidden="true" />}
          {index === 0 ? <button type="button" className={styles.explore} onClick={() => jumpTo(1)}><FiArrowDown aria-hidden="true" />{story.id === 'bal' ? 'Intră în poveste' : 'Descoperă activitățile'}<span>prin scroll</span></button> : <button type="button" className={styles.enlarge} onClick={() => onOpenImage(frame.photo.src, frame.photo.alt)}><FiMaximize2 aria-hidden="true" />Vezi fotografia</button>}
        </div>
        {index > 0 && <span className={styles.largeNumber} aria-hidden="true">0{index}</span>}
      </article>)}

      <div className={styles.lighting} aria-hidden="true" />
      <nav className={styles.chapters} aria-label={`Capitole ${story.title}`}>
        {story.chapters.map((chapter, index) => <button key={chapter.label} type="button" ref={element => { jumpRefs.current[index] = element }} onClick={() => jumpTo(index + 1)} aria-label={`Mergi la ${chapter.label}`}><span>0{index + 1}</span><span>{chapter.label}</span></button>)}
        <a href="#story-overview" className={styles.continue} aria-label="Continuă după poveste"><FiArrowRight aria-hidden="true" /></a>
      </nav>
      <div className={styles.progress} aria-hidden="true"><span ref={progressRef} /></div>
    </div>
  </section>
}

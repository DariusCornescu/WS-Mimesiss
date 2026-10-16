'use client'

import Image from 'next/image'
import InlineAlbum from './InlineAlbum'
import MimesissScrollStory from './MimesissScrollStory'
import EventScrollStory from './EventScrollStory'
import { getEventStory } from '../lib/event-stories'
import { FiMaximize2 } from 'react-icons/fi'
import type { StoryProject } from '../lib/content'
import styles from './StoryDesign.module.css'

type StoryDesignProps = {
  project: StoryProject
  onOpenImage: (src: string, alt: string) => void
}

function paragraphs(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : value.split(/\n\s*\n/).filter(Boolean)
}

export default function StoryDesign({ project, onOpenImage }: StoryDesignProps) {
  const isCongress = project.id === 'mimesiss'

  const photo = (src: string, alt: string, className = '', eager = false) => {
    const picture = <Image src={src} alt={alt} width={1414} height={2000} sizes="(max-width: 760px) calc(100vw - 40px), (max-width: 1200px) 65vw, 820px" unoptimized loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} className={styles.photo} />
    return (
    <figure className={`${styles.figure} ${className}`}>
      {isCongress ? picture : <button type="button" className={styles.photoButton} onClick={() => onOpenImage(src, alt)} aria-label={`Mărește imaginea: ${alt}`}>{picture}<span className={styles.expand} aria-hidden="true"><FiMaximize2 /></span></button>}
      <div className={styles.captionSpace} aria-hidden="true" />
    </figure>
    )
  }

  return (
    <div className={`${styles.story} ${!isCongress ? styles.eventStory : ''}`}>
      {isCongress ? <MimesissScrollStory /> : <EventScrollStory key={project.id} story={getEventStory(project)} />}

        <section id="story-overview" className={styles.overview} aria-labelledby="story-overview-title">
          <div className={styles.chapterLabel}>{!isCongress && <span>05</span>}<p>Despre proiect</p><span className={styles.rule} /></div>
          {project.id === 'bal' ? <>
            <h2 id="story-overview-title" className={styles.ballOverviewTitle}>{project.title}</h2>
            <div className={styles.ballOverviewGrid}>
              <div className={styles.bodyCopy}>{project.description.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
              <InlineAlbum photos={project.gallery} onOpenImage={onOpenImage} />
            </div>
          </> : <div className={styles.overviewGrid}>
            <h2 id="story-overview-title">{project.title}</h2>
            <div className={styles.bodyCopy}>{project.description.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          </div>}
        </section>

      {project.sections?.filter(section => !isCongress || section.title !== 'Conferințe').map((section, index) => {
        const isWorkshop = /workshop|atelier/i.test(section.title)
        const sectionParagraphs = paragraphs(section.description)

        return (
          <section className={`${styles.chapter} ${isWorkshop ? styles.workshopChapter : ''}`} key={`${section.title}-${index}`} aria-labelledby={`story-chapter-${index}`}>
            <div className={styles.chapterLabel}>{!isCongress && <span>{String(index + 2).padStart(2, '0')}</span>}<p>{section.title}</p><span className={styles.rule} /></div>
            <h2 id={`story-chapter-${index}`} className={styles.chapterTitle}>{section.title}</h2>
            {isWorkshop ? (
              <>
                <div className={styles.workshopStage}>
                  {photo(section.image, section.imageAlt, styles.workshopFigure)}
                  <div className={styles.workshopCopy}>
                    <p className={styles.overlayLabel}>MIMESISS · Experiență practică</p>
                    <h3>{section.subtitle}</h3>
                    {sectionParagraphs.slice(0, 2).map((paragraph, paragraphIndex) => <p className={styles.fullOverlayText} key={paragraphIndex}>{paragraph}</p>)}

                  </div>
                </div>
                <div className={styles.mobileLongCopy}>{sectionParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
                {sectionParagraphs.length > 2 && <div className={styles.chapterExtra}>{sectionParagraphs.slice(2).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div>}
              </>
            ) : (
              <div className={styles.chapterGrid}>
                {photo(section.image, section.imageAlt, styles.chapterFigure)}
                <div className={styles.chapterCopy}>
                  <p className={styles.overlayLabel}>MIMESISS · {section.title}</p>
                  <h3>{section.subtitle}</h3>
                  {sectionParagraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                </div>
              </div>
            )}
          </section>
        )
      })}

    </div>
  )
}

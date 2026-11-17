'use client'

import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'
import Countdown, { useNow } from '@/components/ui/Countdown'
import { pathAudience, pathProject } from '@/lib/path-project'
import styles from './PathProject.module.css'

type Phase = 'before-registration' | 'registration-open' | 'live' | 'ended'

const seconds = (iso: string) => Math.floor(Date.parse(iso) / 1000)

function phaseAt(now: number): Phase {
  if (now >= seconds(pathProject.endsAt)) return 'ended'
  if (now >= seconds(pathProject.startsAt)) return 'live'
  if (now >= seconds(pathProject.registrationOpensAt)) return 'registration-open'
  return 'before-registration'
}

/**
 * Faza proiectului se schimbă singură, fără redeploy: înainte de înscrieri,
 * înscrieri deschise, în desfășurare, încheiat. `renderedAt` este ora la care
 * serverul a generat pagina, folosită până când ceasul clientului e disponibil,
 * ca HTML-ul hidratat să fie identic cu cel trimis.
 */
function usePhase(renderedAt: number): Phase {
  return phaseAt(useNow() ?? renderedAt)
}

export function PathHeroTimer({ renderedAt }: { renderedAt: number }) {
  const phase = usePhase(renderedAt)
  if (phase === 'ended') return <p className={styles.heroStatus}>Prima ediție PATH s-a încheiat.</p>
  if (phase === 'live') return <p className={styles.heroStatus} data-live>PATH se desfășoară acum.</p>
  const opening = phase === 'before-registration'
  return (
    <div className={styles.heroTimer}>
      <Countdown
        target={opening ? pathProject.registrationOpensAt : pathProject.startsAt}
        label={opening ? 'Timp rămas până la deschiderea înscrierilor PATH' : 'Timp rămas până la PATH'}
        caption={<p className={styles.timerLabel}>{opening ? 'Înscrierile se deschid în' : 'PATH începe în'}</p>}
      />
    </div>
  )
}

/** Deschiderea către toți studenții; dispare odată ce ediția a început. */
export function PathAudience({ renderedAt }: { renderedAt: number }) {
  const now = useNow() ?? renderedAt
  const phase = phaseAt(now)
  if (phase === 'live' || phase === 'ended') return null
  const choiceOpen = now >= seconds(pathAudience.workshopChoiceOpensAt)
  return (
    <aside className={styles.audience} aria-labelledby="path-audience-title">
      <h3 id="path-audience-title">{pathAudience.title}</h3>
      {pathAudience.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
      <p className={styles.audienceNote}>
        {choiceOpen ? pathAudience.capacityNote : `${pathAudience.workshopChoiceSoon} ${pathAudience.capacityNote}`}
      </p>
    </aside>
  )
}

export function PathRegistration({ renderedAt }: { renderedAt: number }) {
  const phase = usePhase(renderedAt)

  if (phase === 'before-registration') {
    return (
      <div className={styles.registration}>
        <div>
          <h2 id="inscrieri-title">Înscrierile se deschid pe {pathProject.registrationOpensLabel}.</h2>
          <p>Înscrierea se face direct aici, pe site. Până atunci, urmărește-ne pe Instagram pentru workshopuri și medicii care le susțin.</p>
        </div>
        <div className={styles.registrationTimer}>
          <Countdown target={pathProject.registrationOpensAt} label="Timp rămas până la deschiderea înscrierilor PATH" caption={<p className={styles.timerLabel}>Mai sunt</p>} />
        </div>
      </div>
    )
  }

  if (phase === 'registration-open') {
    return (
      <div className={styles.registration}>
        <div>
          <h2 id="inscrieri-title">{pathProject.registrationHref ? 'Înscrierile sunt deschise.' : 'Înscrierile se deschid în scurt timp.'}</h2>
          <p>{pathProject.registrationHref
            ? 'Te înscrii cumpărând biletul PATH, care include două workshopuri. La cumpărare poți adăuga și un al treilea. Workshopurile le alegi ulterior, din contul tău.'
            : 'Revino pe această pagină: aici apare formularul de înscriere.'}</p>
        </div>
        {pathProject.registrationHref && <Link href={pathProject.registrationHref} className={styles.primaryButton}>Cumpără biletul <FaArrowRight aria-hidden="true" /></Link>}
      </div>
    )
  }

  return (
    <div className={styles.registration}>
      <div>
        <h2 id="inscrieri-title">{phase === 'live' ? 'PATH se desfășoară acum.' : 'Prima ediție PATH s-a încheiat.'}</h2>
        <p>Înscrierile pentru această ediție sunt închise. Urmărește-ne pe Instagram pentru edițiile următoare.</p>
      </div>
    </div>
  )
}

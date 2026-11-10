'use client'

import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'
import Countdown, { useNow } from '@/components/ui/Countdown'
import { pathProject } from '@/lib/path-project'
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
          <p>{pathProject.registrationHref ? 'Alege workshopurile la care vrei să participi și rezervă-ți locul.' : 'Revino pe această pagină: aici apare formularul de înscriere.'}</p>
        </div>
        {pathProject.registrationHref && <Link href={pathProject.registrationHref} className={styles.primaryButton}>Înscrie-te <FaArrowRight aria-hidden="true" /></Link>}
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

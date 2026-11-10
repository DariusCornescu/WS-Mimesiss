'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import styles from './Countdown.module.css'

/**
 * Ceasul vine dintr-un store extern, nu din useState + useEffect: serverul și
 * hidratarea văd `null` (liniuțe în loc de cifre), iar clientul trece la ora
 * reală imediat după — fără nepotrivire de hidratare și fără un `mounted`.
 */
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000)
  return () => window.clearInterval(id)
}
const clientNow = () => Math.floor(Date.now() / 1000)
const serverNow = () => null

/** Secunda curentă (epoch), sau `null` pe server și în timpul hidratării. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, clientNow, serverNow)
}

const UNITS = [
  { key: 'days', one: 'zi', many: 'zile' },
  { key: 'hours', one: 'oră', many: 'ore' },
  { key: 'minutes', one: 'minut', many: 'minute' },
  { key: 'seconds', one: 'secundă', many: 'secunde' },
] as const

function split(totalSeconds: number) {
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

/**
 * Numărătoare inversă până la `target` (ISO). `caption` apare deasupra cât
 * timp se numără; după termen rămâne doar `done`, dacă există. Culorile se
 * setează din părinte prin variabilele `--cd-*`, ca aceeași componentă să
 * intre și pe fundal deschis, și pe închis.
 */
export default function Countdown({ target, label, caption, done = null, className }: { target: string; label: string; caption?: ReactNode; done?: ReactNode; className?: string }) {
  const now = useNow()
  const remaining = now === null ? null : Math.floor(Date.parse(target) / 1000) - now
  if (remaining !== null && remaining <= 0) return <>{done}</>
  const parts = remaining === null ? null : split(remaining)

  return (
    <>
      {caption}
      <div role="timer" aria-label={label} className={`${styles.countdown} ${className ?? ''}`}>
        {UNITS.map(unit => {
          const value = parts?.[unit.key]
          return (
            <div key={unit.key} className={styles.cell}>
              <span className={styles.value}>{value === undefined ? '--' : String(value).padStart(2, '0')}</span>
              <span className={styles.unit}>{value === 1 ? unit.one : unit.many}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}

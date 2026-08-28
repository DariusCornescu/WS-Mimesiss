'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Numărătoare animată pentru banda de statistici de pe homepage.
 *
 * Aceeași filozofie ca Reveal: zero dependențe, pornită de un
 * IntersectionObserver. La prefers-reduced-motion sare direct la valoarea
 * finală, iar valorile non-numerice se afișează ca atare, fără animație.
 */
export default function CountUp({
  value,
  duration = 1200,
  className = '',
}: {
  value: string
  duration?: number
  className?: string
}) {
  const target = Number.parseInt(value, 10)
  const isNumeric = Number.isFinite(target)
  const ref = useRef<HTMLParagraphElement>(null)
  const started = useRef(false)
  const [display, setDisplay] = useState(isNumeric ? '0' : value)

  useEffect(() => {
    const el = ref.current
    if (!el || !isNumeric) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return
        started.current = true
        observer.disconnect()

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          setDisplay(String(target))
          return
        }

        const t0 = performance.now()
        const tick = (now: number) => {
          const progress = Math.min((now - t0) / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
          setDisplay(String(Math.round(eased * target)))
          if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { rootMargin: '0px 0px -12% 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [isNumeric, target, duration])

  return (
    <p ref={ref} className={className}>
      {display}
    </p>
  )
}

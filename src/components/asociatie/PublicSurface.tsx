'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { isPublicPath } from '@/lib/public-routes'
import './public.css'

export default function PublicSurface({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isPublicPath(pathname) || !root.current) return
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    const animations = new Set<Animation>()
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        observer.unobserve(entry.target)
        const animation = entry.target.animate([
          { opacity: .25, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' })
        animations.add(animation)
        animation.onfinish = () => animations.delete(animation)
      })
    }, { threshold: .08 })
    root.current.querySelectorAll('[data-entrance], .public-card, .person-card, .gallery-grid button, .header-div h1').forEach(element => observer.observe(element))
    const stop = () => { if (motion.matches) { observer.disconnect(); animations.forEach(animation => animation.cancel()) } }
    motion.addEventListener('change', stop)
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); motion.removeEventListener('change', stop) }
  }, [pathname])
  return <div ref={root} className={isPublicPath(pathname) ? 'public-site' : undefined}>{children}</div>
}

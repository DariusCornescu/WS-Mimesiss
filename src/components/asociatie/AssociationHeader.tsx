'use client'

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FaBars, FaChevronDown, FaTimes, FaUser, FaArrowRight } from 'react-icons/fa'
import styles from './AssociationHeader.module.css'

const links = [
  { href: '/', label: 'Acasă' },
  { href: '/despre', label: 'Despre noi' },
  { href: '/proiecte', label: 'Proiecte' },
  { href: '/congres', label: 'MIMESISS' },
  { href: '/contact', label: 'Contact' },
]

const projectLinks = [
  { href: '/proiecte/mimesiss', label: 'MIMESISS', image: '/project-stories/neural-space/photo-1.webp' },
  { href: '/proiecte/balul-bobocilor', label: 'Balul bobocilor', image: '/project-stories/originals/ball/img-9112-355bf49.webp' },
  { href: '/proiecte/cortul-imm', label: 'Cortul IMM', image: '/project-stories/originals/tent/photo-2026-10-10-10-44-29-3-jpg-20a4e92.webp' },
]

const congressLinks = [
  { href: '/congres', label: 'Prezentare' },
  { href: '/congres/info', label: 'Informații' },
  { href: '/congres/program', label: 'Program' },
  { href: '/congres/workshops', label: 'Ateliere' },
  { href: '/congres/editii', label: 'Ediții anterioare' },
  { href: '/congres/gallery', label: 'Galerie' },
  { href: '/congres/reg', label: 'Regulament' },
  { href: '/congres/ghid', label: 'Ghid abstracte' },
]

export default function AssociationHeader() {
  const pathname = usePathname()
  const [openPath, setOpenPath] = useState<string | null>(null)
  const [congressOpen, setCongressOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDialogElement>(null)
  const open = openPath === pathname
  const inCongress = pathname.startsWith('/congres')

  const isPrimaryActive = (href: string) => (
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
  )

  const isCongressActive = (href: string) => (
    href === '/congres' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  )

  const closeMenu = () => {
    setOpenPath(null)
    setCongressOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const panel = menuPanelRef.current
    if (!panel) return
    const menuButton = menuButtonRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.showModal()
    panel.querySelector<HTMLButtonElement>('button[aria-label="Închide meniul"]')?.focus()
    const keepFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = [...panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]')].filter(item => item.getClientRects().length)
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    panel.addEventListener('keydown', keepFocus)
    const desktop = window.matchMedia('(min-width: 1141px)')
    const closeOnDesktop = () => { if (desktop.matches) { setOpenPath(null); setCongressOpen(false) } }
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      panel.removeEventListener('keydown', keepFocus)
      panel.close()
      menuButton?.focus({ preventScroll: true })
      document.body.style.overflow = previousOverflow
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [open])

  return (
    <header className={styles.header}>
      <a href="#site-main" className={styles.skipLink}>Sari la conținut</a>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="ASMM — Acasă" className={styles.logo}>
          <Image src="/icons/asmm.png" alt="Asociația Studenților în Medicină Militară" width={268} height={70} priority />
        </Link>

        <nav aria-label="Navigație principală" className={styles.desktopNav}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isPrimaryActive(href) ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>

        <div className={styles.authControls}>
          <SignedOut>
            <Link href="/auth/login" className={styles.signInLink}>Conectare</Link>
            <Link href="/auth/signup" className={styles.signUpLink}>Creează cont</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className={styles.accountLink} aria-label="Contul meu">
              <FaUser aria-hidden="true" />
              <span>Contul meu</span>
            </Link>
            <UserButton />
          </SignedIn>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={open}
          aria-controls="association-menu"
          aria-label={open ? 'Închide meniul' : 'Deschide meniul'}
          className={styles.menuButton}
          onClick={() => open ? closeMenu() : setOpenPath(pathname)}
        >
          {open ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
        </button>
      </div>

      {inCongress && (
        <nav className={styles.congressNav} aria-label="Navigație congres">
          {congressLinks.map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isCongressActive(href) ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      )}

      {open && <dialog ref={menuPanelRef} id="association-menu" className={styles.mobilePanel} aria-label="Navigație mobilă" onCancel={closeMenu} onClick={event => { if (event.target === event.currentTarget) closeMenu() }}>
        <div className={styles.mobileHeader}>
          <Link href="/" aria-label="ASMM — Acasă" className={styles.mobileLogo} onClick={closeMenu}><Image src="/icons/asmm.png" alt="" width={210} height={55} /></Link>
          <button type="button" aria-label="Închide meniul" className={styles.closeButton} onClick={closeMenu}><FaTimes aria-hidden="true" /></button>
        </div>
        <div className={styles.mobileScroll}>
          <nav aria-label="Navigație principală mobilă" className={styles.mobileNav}>
            {links.filter(link => !['/proiecte', '/congres'].includes(link.href)).map(({ href, label }) => <Link key={href} href={href} aria-current={isPrimaryActive(href) ? 'page' : undefined} onClick={closeMenu}>{label}</Link>)}
          </nav>
          <section className={styles.mobileProjects} aria-labelledby="mobile-projects-title">
            <div className={styles.mobileSectionHeading}><h2 id="mobile-projects-title">Proiectele noastre</h2><Link href="/proiecte" onClick={closeMenu}>Vezi toate <FaArrowRight aria-hidden="true" /></Link></div>
            <nav aria-label="Proiecte ASMM" className={styles.mobileProjectLinks}>
              {projectLinks.map(project => <Link key={project.href} href={project.href} aria-current={pathname === project.href ? 'page' : undefined} onClick={closeMenu}><Image src={project.image} alt="" width={54} height={54} sizes="54px" /><span>{project.label}</span><FaArrowRight aria-hidden="true" /></Link>)}
            </nav>
          </section>
          <div className={styles.mobileCongressGroup}>
            <button type="button" className={styles.mobileCongressToggle} aria-expanded={congressOpen} aria-controls="mobile-congress-links" data-active={inCongress || undefined} onClick={() => setCongressOpen(current => !current)}><span>Congresul MIMESISS</span><FaChevronDown aria-hidden="true" /></button>
            {congressOpen && <nav id="mobile-congress-links" className={styles.mobileCongressLinks} aria-label="Navigație congres mobilă">{congressLinks.map(({ href, label }) => <Link key={href} href={href} aria-current={isCongressActive(href) ? 'page' : undefined} onClick={closeMenu}>{label}</Link>)}</nav>}
          </div>
          <nav className={styles.mobileShortcuts} aria-label="Acces rapid"><Link href="/congres/workshops" onClick={closeMenu}>Ateliere <FaArrowRight aria-hidden="true" /></Link><Link href="/congres/gallery" onClick={closeMenu}>Galerie foto <FaArrowRight aria-hidden="true" /></Link></nav>
        </div>
        <div className={styles.mobileAuth}>
          <SignedOut><Link href="/auth/login" onClick={closeMenu}>Conectare</Link><Link href="/auth/signup" className={styles.mobileSignUp} onClick={closeMenu}>Creează cont</Link></SignedOut>
          <SignedIn><Link href="/dashboard" className={styles.mobileAccountLink} onClick={closeMenu}><FaUser aria-hidden="true" />Contul meu</Link><UserButton /></SignedIn>
        </div>
      </dialog>}
    </header>
  )
}

'use client'

import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { FaBars, FaChevronDown, FaTimes, FaUser } from 'react-icons/fa'
import styles from './AssociationHeader.module.css'

const links = [
  { href: '/', label: 'Acasă' },
  { href: '/despre', label: 'Despre noi' },
  { href: '/proiecte', label: 'Proiecte' },
  { href: '/congres', label: 'MIMESISS' },
  { href: '/contact', label: 'Contact' },
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
  const menuPanelRef = useRef<HTMLDivElement>(null)
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

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const panel = menuPanelRef.current
    const initialFocusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    initialFocusable?.[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPath(null)
        setCongressOpen(false)
        menuButtonRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') return
      const focusable = panel?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
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

      {open && (
        <div className={styles.mobileLayer}>
          <button type="button" className={styles.backdrop} aria-label="Închide meniul" onClick={closeMenu} />
          <div
            ref={menuPanelRef}
            id="association-menu"
            className={styles.mobilePanel}
            role="dialog"
            aria-modal="true"
            aria-label="Navigație mobilă"
          >
            <div className={styles.mobileHeader}>
              <Link href="/" aria-label="ASMM — Acasă" className={styles.mobileLogo} onClick={closeMenu}>
                <Image src="/icons/asmm.png" alt="" width={210} height={55} />
              </Link>
              <button
                type="button"
                aria-label="Închide meniul"
                className={styles.closeButton}
                onClick={() => {
                  closeMenu()
                  menuButtonRef.current?.focus()
                }}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Navigație principală mobilă" className={styles.mobileNav}>
              {links.map(({ href, label }) => href === '/congres' ? (
                <div key={href} className={styles.mobileCongressGroup}>
                  <button
                    type="button"
                    className={styles.mobileCongressToggle}
                    aria-expanded={congressOpen}
                    aria-controls="mobile-congress-links"
                    data-active={inCongress || undefined}
                    onClick={() => setCongressOpen((current) => !current)}
                  >
                    <span>{label}</span>
                    <FaChevronDown aria-hidden="true" />
                  </button>
                  {congressOpen && (
                    <div id="mobile-congress-links" className={styles.mobileCongressLinks}>
                      <p className={styles.mobileCongressIntro}>Descoperă congresul, programul și atelierele.</p>
                      {congressLinks.map(({ href: congressHref, label: congressLabel }) => (
                        <Link key={congressHref} href={congressHref} aria-current={isCongressActive(congressHref) ? 'page' : undefined} onClick={closeMenu}>
                          {congressLabel}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link key={href} href={href} aria-current={isPrimaryActive(href) ? 'page' : undefined} onClick={closeMenu}>
                  {label}
                </Link>
              ))}
            </nav>

            <div className={styles.mobileAuth}>
              <SignedOut>
                <Link href="/auth/login" onClick={closeMenu}>Conectare</Link>
                <Link href="/auth/signup" className={styles.mobileSignUp} onClick={closeMenu}>Creează cont</Link>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard" className={styles.mobileAccountLink} onClick={closeMenu}>
                  <FaUser aria-hidden="true" />
                  Contul meu
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

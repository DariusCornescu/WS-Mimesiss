'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { FaBars, FaTimes, FaUser } from 'react-icons/fa'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import styles from './AssociationHome.module.css'

const links = [
  { href: '/', label: 'Acasă' },
  { href: '/despre', label: 'Despre noi' },
  { href: '/proiecte', label: 'Proiecte' },
  { href: '/congres', label: 'MIMESISS' },
  { href: '/contact', label: 'Contact' },
]

export default function AssociationHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const active = (href: string) => href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
  const congressLinks = [
    ['/congres', 'Prezentare'], ['/congres/info', 'Informații'], ['/congres/program', 'Program'],
    ['/congres/workshops', 'Ateliere'], ['/congres/editii', 'Ediții anterioare'], ['/congres/gallery', 'Galerie'],
    ['/congres/reg', 'Regulament'], ['/congres/ghid', 'Ghid abstracte'],
  ]
  return (
    <header className={styles.header}>
      <a href="#site-main" className={styles.skipLink}>Sari la conținut</a>
      <div className={styles.headerInner}>
        <Link href="/" aria-label="ASMM — Acasă" className={styles.logo}>
          <Image src="/icons/asmm.png" alt="Asociația Studenților în Medicină Militară" width={268} height={70} priority />
        </Link>
        <nav aria-label="Navigație principală" className={styles.desktopNav}>
          {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined}>{label}</Link>)}
        </nav>
        <div className={styles.authControls}>
          <SignedOut>
            <SignInButton mode="modal"><button type="button" className={styles.signInLink}>Conectare</button></SignInButton>
            <SignUpButton mode="modal"><button type="button" className={styles.signUpLink}>Creează cont</button></SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className={styles.accountLink} aria-label="Contul meu"><FaUser aria-hidden="true" /><span>Contul meu</span></Link>
            <UserButton />
          </SignedIn>
        </div>
        <button type="button" aria-expanded={open} aria-controls="association-menu" aria-label={open ? 'Închide meniul' : 'Deschide meniul'} className={styles.menuButton} onClick={() => setOpen(!open)}>
          {open ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
        </button>
      </div>
      {open && <nav id="association-menu" aria-label="Navigație mobilă" className={styles.mobileNav} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); document.querySelector<HTMLButtonElement>('[aria-controls="association-menu"]')?.focus() } }}>
        {links.map(({ href, label }) => <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} onClick={() => setOpen(false)}>{label}</Link>)}
        <SignedOut>
          <Link href="/sign-in" onClick={() => setOpen(false)}>Conectare</Link>
          <Link href="/sign-up" onClick={() => setOpen(false)}>Înregistrare</Link>
        </SignedOut>
      </nav>}
      {pathname.startsWith('/congres') && <nav className="congress-nav" aria-label="Navigație congres">{congressLinks.map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>)}</nav>}
    </header>
  )
}

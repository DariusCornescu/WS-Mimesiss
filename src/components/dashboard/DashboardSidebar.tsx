'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FaBars,
  FaCalendarAlt,
  FaChartBar,
  FaCogs,
  FaCreditCard,
  FaHome,
  FaImages,
  FaProjectDiagram,
  FaTicketAlt,
  FaTimes,
  FaUser,
  FaUsers,
} from 'react-icons/fa'
import type { IconType } from 'react-icons'
import type { User } from '@/types/models'
import SignOutButton from '@/components/dashboard/signOutButton'
import { useAppSettings } from '@/contexts/AppSettingsContext'
import styles from './DashboardSidebar.module.css'

interface DashboardSidebarProps {
  user: DashboardNavigationUser
}

export type DashboardNavigationUser = Pick<User, 'email' | 'firstName' | 'lastName' | 'role'>

interface NavigationItem {
  href: string
  icon: IconType
  label: string
}

interface NavigationGroup {
  label: string
  links: NavigationItem[]
}

function isCurrentPath(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/admin' || href === '/dashboard/moderator') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { eventMode } = useAppSettings()
  const [mobileOpen, setMobileOpen] = useState(false)

  const accountLinks: NavigationItem[] = [
    { href: '/dashboard', icon: FaHome, label: 'Prezentare generală' },
    { href: '/dashboard/profile', icon: FaUser, label: 'Profilul meu' },
    ...(eventMode !== 'ball'
      ? [{ href: '/dashboard/registrations', icon: FaCalendarAlt, label: 'Înscrierile mele' }]
      : []),
    { href: '/dashboard/tickets', icon: FaTicketAlt, label: 'Biletele mele' },
    ...(eventMode !== 'ball'
      ? [{ href: '/congres/workshops', icon: FaCalendarAlt, label: 'Workshopuri' }]
      : []),
    { href: '/payment', icon: FaCreditCard, label: 'Cumpără bilet' },
  ]

  const adminLinks: NavigationItem[] = [
    { href: '/admin', icon: FaChartBar, label: 'Prezentare admin' },
    { href: '/admin/workshops', icon: FaCalendarAlt, label: 'Workshopuri' },
    { href: '/admin/proiecte', icon: FaProjectDiagram, label: 'Proiecte și anunțuri' },
    { href: '/admin/galerie', icon: FaImages, label: 'Galerie MIMESISS' },
    { href: '/admin/parteneri', icon: FaUsers, label: 'Parteneri și sponsori' },
    { href: '/admin/users', icon: FaUsers, label: 'Utilizatori' },
    { href: '/admin/tickets', icon: FaTicketAlt, label: 'Bilete' },
    { href: '/admin/payments', icon: FaCreditCard, label: 'Plăți' },
    { href: '/admin/settings', icon: FaCogs, label: 'Setări' },
  ]

  const operationsLinks: NavigationItem[] = [
    { href: '/dashboard/moderator', icon: FaCalendarAlt, label: 'Panou moderator' },
    { href: '/dashboard/moderator/tickets', icon: FaTicketAlt, label: 'Bilete emise' },
  ]

  const groups: NavigationGroup[] = [
    { label: 'Contul meu', links: accountLinks },
    ...(user.role === 'admin' ? [{ label: 'Administrare', links: adminLinks }] : []),
    ...(user.role === 'admin' || user.role === 'moderator'
      ? [{ label: 'Operațional', links: operationsLinks }]
      : []),
  ]

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email
  const roleLabel = user.role === 'admin'
    ? 'Administrator'
    : user.role === 'moderator'
      ? 'Moderator'
      : 'Participant'

  const navigation = (onNavigate?: () => void) => (
    <nav className={styles.nav} aria-label="Navigația contului">
      {groups.map((group) => (
        <div className={styles.group} key={group.label}>
          <p className={styles.groupLabel}>{group.label}</p>
          {group.links.map((link) => {
            const active = isCurrentPath(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={onNavigate}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
              >
                <link.icon aria-hidden="true" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )

  const identity = (
    <div className={styles.identity}>
      <p className={styles.identityKicker}>Spațiul personal</p>
      <p className={styles.identityName}>{displayName}</p>
      <p className={styles.identityRole}>{roleLabel}</p>
    </div>
  )

  return (
    <>
      <aside className={styles.desktopSidebar} aria-label="Meniu cont">
        <div className={styles.desktopInner}>
          <div className={styles.desktopIdentity}>{identity}</div>
          <div className={styles.desktopNav}>{navigation()}</div>
          <div className={styles.signOutArea}>
            <SignOutButton className={styles.signOutButton} />
          </div>
        </div>
      </aside>

      <div className={styles.mobileNavigation}>
        <div className={styles.mobileBar}>
          {identity}
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={mobileOpen}
            aria-controls="account-mobile-menu"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
            <span>{mobileOpen ? 'Închide' : 'Meniu cont'}</span>
          </button>
        </div>
        {mobileOpen && (
          <div className={styles.mobilePanel} id="account-mobile-menu">
            {navigation(() => setMobileOpen(false))}
            <div className={styles.signOutArea}>
              <SignOutButton className={styles.signOutButton} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

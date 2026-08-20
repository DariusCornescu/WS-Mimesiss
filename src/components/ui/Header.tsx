'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  FaBars,
  FaCalendarAlt,
  FaChartBar,
  FaHome,
  FaImage,
  FaInfoCircle,
  FaTimes,
  FaUser,
  FaUsers
} from 'react-icons/fa'

import AuthLinks from '@/components/dashboard/AuthLinks'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }

  const links = [
    { href: '/', label: 'Acasă', icon: FaHome },
    { href: '/info', label: 'Informații', icon: FaInfoCircle },
    { href: '/program', label: 'Program', icon: FaCalendarAlt },
    { href: '/about', label: 'Cine suntem', icon: FaUsers },
    { href: '/workshops', label: 'Ateliere', icon: FaCalendarAlt },
    { href: '/editii', label: 'Ediții anterioare', icon: FaChartBar },
    { href: '/contact', label: 'Date de contact', icon: FaUser },
    { href: '/gallery', label: 'Galerie foto', icon: FaImage },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between h-16 mx-auto px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
          className='block py-2'
            src="/icons/asmm.png"
            alt="MIMESISS 2025"
            width={200}
            height={68}
            priority
            quality={75}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-3">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`transition-colors relative underline-offset-4 ${isActive(href) ? 'text-primary underline' : 'text-foreground hover:text-primary hover:underline'}`}>
              <Icon className="mr-2 hidden lg:inline-block" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Section - REPLACED */}
        <AuthLinks variant="desktop" />

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label='Open Mobile Menu'
          className="lg:hidden p-2 text-foreground hover:bg-accent rounded-md transition-colors"
          onClick={toggleMobileMenu}
        >
          <FaBars className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Side Menu Overlay */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}>
        {/* Backdrop */}
        <button
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={toggleMobileMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleMobileMenu();
            }
          }}
          type='button'
          tabIndex={0}
        ></button>

        {/* Side Menu */}
        <div className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <Link href="/" className="text-xl font-bold text-foreground">
                MIMESISS
              </Link>
              <button
                aria-label='Close Mobile Menu'
                type="button"
                onClick={toggleMobileMenu}
                className="p-2 text-foreground hover:bg-accent rounded-md transition-colors duration-200"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
              {links.map(({ href, label, icon: Icon }, index) => (
                <Link
                  key={href}
                  href={href}
                  onClick={toggleMobileMenu}
                  className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 transform ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                    } ${isActive(href) ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-primary/20 hover:text-primary'}`}
                  style={{ transitionDelay: isMobileMenuOpen ? `${(index + 2) * 100}ms` : '0ms' }}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {label}
                </Link>
              ))}
            </nav>
            <AuthLinks
              variant="mobile"
              isMobileMenuOpen={isMobileMenuOpen}
              onLinkClick={toggleMobileMenu}
            />
          </div>
        </div>
      </div>
    </>
  )
}
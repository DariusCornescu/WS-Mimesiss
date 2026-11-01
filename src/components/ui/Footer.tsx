import Image from 'next/image'
import Link from 'next/link'
import { FaEnvelope, FaFacebook, FaInstagram } from 'react-icons/fa'

const associationLinks = [
  { href: '/', label: 'Acasă' },
  { href: '/despre', label: 'Despre noi' },
  { href: '/proiecte', label: 'Proiecte' },
  { href: '/contact', label: 'Contact' },
]

const congressLinks = [
  { href: '/congres', label: 'Prezentare' },
  { href: '/congres/info', label: 'Informații' },
  { href: '/congres/workshops', label: 'Ateliere' },
  { href: '/congres/program', label: 'Program' },
  { href: '/congres/reg', label: 'Regulament' },
  { href: '/congres/ghid', label: 'Ghid abstracte' },
]

const accountLinks = [
  { href: '/auth/login', label: 'Conectare' },
  { href: '/auth/signup', label: 'Creează cont' },
  { href: '/dashboard', label: 'Contul meu' },
]

const linkClass = 'text-sm leading-6 text-[hsl(var(--brand-ivory))] transition-colors hover:text-[hsl(var(--brand-sand))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--brand-sand))]'

export default function Footer() {
  return (
    <footer className="w-full border-t border-[hsl(var(--brand-sand)/.22)] bg-[hsl(var(--brand-deep))] text-[hsl(var(--brand-ivory))]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,minmax(0,1fr))] lg:px-8">
        <div className="max-w-sm">
          <Link href="/" aria-label="ASMM — Acasă" className="inline-block w-64 max-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[hsl(var(--brand-sand))]">
            <Image
              src="/icons/asmm.png"
              alt="Asociația Studenților în Medicină Militară"
              width={268}
              height={70}
              className="h-auto w-full brightness-0 invert"
            />
          </Link>
          <p className="mt-5 text-sm leading-7 text-[hsl(var(--brand-ivory)/.78)]">
            Comunitatea studenților care învață, organizează și construiește împreună viitorul medicinei militare.
          </p>
          <div className="mt-6 flex items-center gap-5">
            <a href="mailto:secretariat@asmm-bucuresti.com" aria-label="Trimite un e-mail către ASMM" className={linkClass}>
              <FaEnvelope className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/asmm.bucuresti?igsh=MWExZHc0Y3hrNWh1bg==" target="_blank" rel="noopener noreferrer" aria-label="ASMM pe Instagram" className={linkClass}>
              <FaInstagram className="h-5 w-5" aria-hidden="true" />
            </a>
            <a href="https://www.facebook.com/share/1CmCN8trYg/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="ASMM pe Facebook" className={linkClass}>
              <FaFacebook className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
        </div>

        <FooterGroup title="Asociație" links={associationLinks} />
        <FooterGroup title="MIMESISS" links={congressLinks} />
        <FooterGroup title="Cont" links={accountLinks} />
      </div>

      <div className="border-t border-[hsl(var(--brand-sand)/.18)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs leading-6 text-[hsl(var(--brand-ivory)/.7)] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>&copy; {new Date().getFullYear()} Asociația Studenților în Medicină Militară.</p>
          <p>MIMESISS este un proiect ASMM.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterGroup({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <nav aria-label={`Footer — ${title}`}>
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--brand-sand))]">{title}</h2>
      <ul className="space-y-2.5">
        {links.map(link => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

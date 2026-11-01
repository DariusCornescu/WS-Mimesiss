import Link from 'next/link'
import { FaHome, FaShieldAlt, FaTachometerAlt } from 'react-icons/fa'
import StatePanel from '@/components/ui/StatePanel'

export default function UnauthorizedPage() {
  return (
    <StatePanel
      eyebrow="Acces restricționat"
      icon={<FaShieldAlt aria-hidden="true" />}
      title="Nu ai acces la această pagină"
      description="Contul tău nu are permisiunile necesare pentru această secțiune. Poți reveni în spațiul personal sau pe pagina principală."
      tone="destructive"
    >
      <Link
        href="/dashboard"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <FaTachometerAlt aria-hidden="true" />
        Mergi la contul meu
      </Link>
      <Link
        href="/"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-border bg-muted px-6 py-3 font-semibold text-foreground transition-colors hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <FaHome aria-hidden="true" />
        Pagina principală
      </Link>
    </StatePanel>
  )
}

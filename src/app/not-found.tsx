import Link from 'next/link'
import { FaArrowLeft, FaCompass } from 'react-icons/fa'
import StatePanel from '@/components/ui/StatePanel'

export default function NotFound() {
  return (
    <StatePanel
      eyebrow="Eroare 404"
      icon={<FaCompass aria-hidden="true" />}
      title="Pagina nu a fost găsită"
      description="Adresa poate fi greșită sau pagina a fost mutată. Poți reveni la pagina principală și continua de acolo."
    >
      <Link
        href="/"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <FaArrowLeft aria-hidden="true" />
        Înapoi la pagina principală
      </Link>
    </StatePanel>
  )
}

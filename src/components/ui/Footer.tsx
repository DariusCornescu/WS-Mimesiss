import Link from 'next/link'
import { FaCircle, FaEnvelope, FaInstagram, FaFacebook } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col gap-8">
        <div className="text-center text-sm text-muted-foreground [&_a:hover]:underline">
          <Link href="/congres/reg">
            Regulament
          </Link>

          <FaCircle className="inline mx-2" size={6} />

          <Link href='/congres/ghid'>
            Ghid redactare abstracte
          </Link>

          <FaCircle className="inline mx-2" size={6} />

          <Link href="/contact">
            Contact
          </Link>
        </div>


        <div className="flex flex-row justify-center items-center space-x-6">
          <Link href="mailto:secretariat@asmm-bucuresti.com" aria-label="EMail">
            <FaEnvelope className="h-6 w-6 text-primary mb-4" />
          </Link>

          <Link href="https://www.instagram.com/asmm.bucuresti?igsh=MWExZHc0Y3hrNWh1bg==" target="_blank" aria-label="Instagram">
            <FaInstagram className="h-6 w-6 text-primary mb-4" />
          </Link>

          <Link href="https://www.facebook.com/share/1CmCN8trYg/?mibextid=wwXIfr" target="_blank" aria-label="Facebook">
            <FaFacebook className="h-6 w-6 text-primary mb-4" />
          </Link>

        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
          <p className="mb-2">
            &copy; {new Date().getFullYear()} MIMESISS. Toate drepturile rezervate.
          </p>
          <p className="text-xs">
            Dezvoltat de Cornescu Darius
          </p>
        </div>
      </div>
    </footer>
  )
}

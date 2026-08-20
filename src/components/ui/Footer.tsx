import Image from 'next/image'
import Link from 'next/link'
import { FaCircle, FaEnvelope, FaInstagram, FaFacebook } from 'react-icons/fa'

/*1. Directia Medicala
2. ⁠Spitalul Militar Central
3. ⁠Institutul National de Medicina Aeronautica
4. ⁠Intitutul Medici Militar
5. ⁠Universitatea de Medicina si Farmacie
*/
const orgs = [
  { src: '/orgs/1.png', alt: 'ASSM' },
]

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-8 flex flex-col gap-8">
        {/* Organization Partners */}
        <h3 className="text-center text-lg font-semibold text-foreground">
          Parteneri și Organizatori
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8">
          {orgs.map((org) => (
            <div key={org.alt} className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-lg p-2 shadow-sm">
              <Image
                src={org.src}
                alt={org.alt}
                width={80}
                height={80}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground [&_a:hover]:underline">
          <Link href="/reg">
            Regulament
          </Link>

          <FaCircle className="inline mx-2" size={6} />

          <Link href='/ghid'>
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
            Dezvoltat de <a target='_blank' rel='noreferrer' className='text-primary underline' href="https://fldr.xyz">Ursan Bogdan</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
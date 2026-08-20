import Image from 'next/image'
import Link from 'next/link'
import { FaCalendar, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'

export default function HomePage() {
  return (
    <>
      {/* Mobile Banner Image */}
      <Image
        src="/banners/mobile-bal.jpg"
        alt="MIMESISS 2025 Mobile Banner"
        width={828}
        height={1242}
        className="w-full h-auto object-cover md:hidden"
        priority
        fetchPriority="high"
        quality={85}
        sizes="100vw"
      />

      {/* Desktop Banner Image */}
      <Image
        src="/banners/desktop-bal.jpeg"
        alt="MIMESISS 2025 Desktop Banner"
        width={1920}
        height={640}
        className="w-full h-auto object-cover hidden md:block"
        priority
        fetchPriority="high"
        quality={85}
        sizes="100vw"
      />

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-10">
        {/* Event Details */}
        <div className="mimesiss-card flex flex-col gap-2 p-6 space-y-4">
          <h1 className="font-bold text-center text-accent mb-4">BALUL BOBOCILOR 2026</h1>

          <p className="text-center text-gray-300 font-semibold">Asociația Studenților în Medicină Militară</p>

          <p className="text-center text-gray-300 leading-relaxed">
            Așa cum v-am obișnuit, revenim cu unul dintre cele mai așteptate evenimente ale anului.
          </p>

          <p className="text-center text-lg font-semibold text-accent mb-4">
            Este momentul să celebrăm noi începturi!!!
          </p>

          <div className="flex items-center justify-center gap-3 my-4">
            <FaMapMarkerAlt className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-semibold">Unde?: Princess Club - Splaiul Independenței 319</span>
          </div>

          <div className="flex items-center justify-center gap-3 my-4">
            <FaCalendar className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="font-semibold">Când?: Vineri, 3 aprilie 2026</span>
          </div>

          <div className="border-t border-border/30 pt-4 mt-4">
            <p className="text-center text-sm text-gray-300 leading-relaxed mb-3">
              ⚠️ Chiar dacă distracția o să fie la maxim, locurile sunt limitate, așa că vă sfătuim să nu stați foarte mult pe gânduri.
            </p>

            <p className="text-center text-sm text-gray-300 leading-relaxed mb-3">
              Garantăm că va fi o seară de neuitate, cu muzică bună, prieteni și spectacol cât cuprinde.
            </p>

            <p className="text-center text-sm font-semibold text-accent mb-3">
              🎉 Hai să sărbătorim împreună și să facem din acest Bal al Bobocilor o amintire de neuitat! 🔥 Ne vedem pe ringul de dans la cea mai tare petrecere a anului 🎉🕺💃🏻
            </p>

            <p>
              <Link href="https://www.livetickets.ro/e/f657339" className="mimesiss-btn-primary" target='_blank'>
                Cumpără Bilet
              </Link>
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-secondary/20 to-background/50 backdrop-blur-sm rounded-lg border border-border/30 p-8 mx-auto">
          <h3 className="text-2xl font-bold text-accent text-center mb-6">Cine suntem?</h3>
          <p className="text-gray-300 text-lg leading-relaxed text-center">
            Asociația Studenților în Medicină Militară (ASMM) este o organizație ce are ca scop reprezentarea studenților Institutului Medico-Militar, a intereselor acestora, cât și organizarea de proiecte care reușesc să îmbine armonios  domeniul medical cu cel militar.
          </p>
        </div>

        {/* Contact Information */}

        <div className="mimesiss-contact-card flex flex-col items-center text-center p-6">
          <FaEnvelope className="h-6 w-6 text-primary mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">Email</h4>
          <a href="mailto:office.asmm@gmail.com" className="mimesiss-text-secondary hover:text-primary transition duration-200">
            office.asmm@gmail.com
          </a>

        </div>
      </div>
    </>
  )
}

import HeaderContent from '@/components/ui/HeaderContent'
import Link from 'next/link'
import { FaUserGraduate, FaFileAlt, FaCreditCard, FaInfoCircle } from 'react-icons/fa'
import { RiContractFill } from 'react-icons/ri'
import { getAppSettings } from '@/lib/settings'
import { getAllTickets } from './actions'

export default async function InfoPage() {
  const settings = await getAppSettings();

  const paymentEnabled = settings ?? false;

  const allTickets = await getAllTickets();
  
  // Filter only enabled tickets
  const tickets = allTickets.filter(ticket => ticket.enabled !== false);

  const activeTicket = tickets.find(ticket => ticket.type === 'active');
  const passiveTicket = tickets.find(ticket => ticket.type === 'passive');

  return (
    <>
      <HeaderContent title='Informații MIMESISS 2025' />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Registration Process */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Cum să te înregistrezi
          </h2>
          
          <div className="mimesiss-info-grid">
            {/* Step 1 */}
            <div className="mimesiss-info-card mimesiss-border-step-1">
              <div className="text-center">
                <div className="mimesiss-info-icon">
                  <FaUserGraduate className="text-primary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">1. Crează-ți un cont</h3>
                <p className="mimesiss-text-secondary text-sm">
                  Apasă pe butonul &ldquo;Înregistrare&rdquo; și completează formularul cu datele tale. 
                  Vei primi un e-mail de confirmare pe care trebuie să-l accesezi pentru a activa contul.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mimesiss-info-card mimesiss-border-step-2">
              <div className="text-center">
                <div className="mimesiss-info-icon">
                  <FaInfoCircle className="text-secondary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">2. Alege tipul de participant</h3>
                <p className="mimesiss-text-secondary text-sm">
                  Selectează dacă dorești să fii participant activ (cu prezentare) sau pasiv 
                  (doar participare la evenimente). Fiecare variantă are taxe diferite.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mimesiss-info-card mimesiss-border-step-3">
              <div className="text-center">
                <div className="mimesiss-info-icon">
                  <FaFileAlt className="text-accent text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">3. Trimite abstractul</h3>
                <p className="mimesiss-text-secondary text-sm">
                  Doar pentru participanții activi. Încarcă abstractul conform ghidului de redactare 
                  disponibil în secțiunea de informații.
                </p>
                <Link href="/ghid" className="text-primary hover:underline">Vezi ghidul de redactare</Link>
              </div>
            </div>

            {/* Step 4 */}
            <div className="mimesiss-info-card mimesiss-border-step-4">
              <div className="text-center">
                <div className="mimesiss-info-icon">
                  <RiContractFill className="text-secondary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">4. Completeaza formularul GDPR</h3>
                <p className="mimesiss-text-secondary text-sm">
                  Înainte de plata taxei, descărcați și completați formularul <Link href="/docs/gdpr.pdf" className="text-primary hover:underline">GDPR</Link> și trimiteți-l împreună cu dovada plății la <Link href="mailto:secretariat@asmm-bucuresti.com" className="text-primary hover:underline">secretariat@asmm-bucuresti.com</Link>. Înscrierea se validează după primirea ambelor documente.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="mimesiss-info-card mimesiss-border-step-4">
              <div className="text-center">
                <div className="mimesiss-info-icon">
                  <FaCreditCard className="text-primary text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">5. Achită taxa</h3>
                <p className="mimesiss-text-secondary text-sm">
                  Plătește taxa de înscriere direct din contul tău prin platforma Stripe.
                  Plata este securizată și procesată instant.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Participation Types */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Tipuri de Participare
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Passive Participants */}
            <div className="bg-card/80 rounded-lg shadow-lg p-8 border border-border/30">
              <div className="text-center mb-6">
                <div className="bg-card/60 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-border/40">
                  <FaUserGraduate className="text-secondary text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">Participanți Pasivi</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300">
                  Iau parte la conferințe, workshopuri și evenimentele din program, fără a prezenta lucrări.
                </p>
                
                <div className="bg-card/50 rounded-lg p-4 border border-border/20">
                  <h4 className="font-semibold text-white mb-2">Beneficii incluse:</h4>
                  <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                    <li>Acces la toate conferințele</li>
                    <li>Participare la workshopuri</li>
                    <li>Materiale de curs</li>
                    <li>Certificat de participare</li>
                    <li>Coffee break și masa de prânz</li>
                  </ul>
                </div>

                {passiveTicket?.price && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary mb-2"> {passiveTicket.price} RON </div>
                    <p className="text-gray-400">Taxa de participare</p>
                  </div>
                )}
                {paymentEnabled && (
                  <Link href="/payment" className="mimesiss-btn-primary items-center">
                    Cumpara bilet
                  </Link>
                )}
              </div>
            </div>

            {/* Active Participants */}
            <div className="bg-card/80 rounded-lg shadow-lg p-8 border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                  Recomandat
                </span>
              </div>
              
              <div className="text-center mb-6">
                <div className="bg-card rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border border-border">
                  <FaFileAlt className="text-primary text-3xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">Participanți Activi</h3>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300">
                  Prezintă o <Link href="/ghid" className="text-primary hover:underline">lucrare științifică</Link> în una dintre secțiunile disponibile.
                </p>
                
                <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                  <h4 className="font-semibold text-white mb-2">Secțiuni disponibile:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li><strong>Medical</strong> - Lucrări de medicină generală</li>
                    <li><strong>Medico-militar</strong> - Medicină militară specifică</li>
                    <li><strong>E-poster</strong> - Prezentări în format digital</li>
                  </ul>
                </div>
                
                <div className="bg-card/50 rounded-lg p-4 border border-border/30">
                  <h4 className="font-semibold text-white mb-2">Beneficii suplimentare:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Toate beneficiile participanților pasivi</li>
                    <li>Prezentare lucrare științifică</li>
                    <li>Feedback de la experți</li>
                    <li>Șanse de câștigare a premiilor</li>
                    <li>Networking cu specialiști</li>
                  </ul>
                </div>

                {activeTicket?.price && (
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{activeTicket.price} RON</div>
                    <p className="text-muted-foreground">Taxa comună pentru toate secțiunile</p>
                  </div>
                )}

                {paymentEnabled && (
                  <Link href="/payment" className="mimesiss-btn-primary items-center">
                    Cumpara bilet
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Eligibility */}
        <div className="bg-card/50 rounded-lg p-8 mb-16 border border-border">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Cine poate participa?
          </h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-300 mb-4">
              Congresul este deschis tuturor studenților la medicină, atât militari, cât și civili, 
              care doresc să se implice activ în mediul științific și academic.
            </p>
            <div className="bg-card/80 pt-4 border-t border-primary">
              <h3 className="text-xl font-semibold text-white mb-3">Cerințe de participare:</h3>
              <ul className="text-gray-300 space-y-2 list-disc list-inside">
                <li>Student la medicină (an pregătitor - anul VI)</li>
                <li>Cont valid pe platforma MIMESISS</li>
                <li>Taxa de participare achitată</li>
                <li>Pentru participanți activi: abstract conform cerințelor</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Gata să te înregistrezi?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Alătură-te celei mai importante conferințe medico-militare pentru studenți!
          </p>
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              href="/auth/signup"
              className="mimesiss-btn-primary inline-flex items-center"
            >
              Înregistrează-te acum
            </Link>
            <Link
              href="/workshops"
              className="mimesiss-btn-secondary inline-flex items-center"
            >
              Vezi programul
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

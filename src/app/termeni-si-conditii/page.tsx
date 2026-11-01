import type { Metadata } from 'next'
import HeaderContent from '@/components/ui/HeaderContent'

export const metadata: Metadata = {
  title: 'Termeni și condiții — draft',
  description: 'Draft al termenilor de utilizare a platformei ASMM.',
  robots: { index: false, follow: false },
}

export default function TermsDraftPage() {
  return (
    <>
      <HeaderContent title="Termeni și condiții" kicker="ASMM · Draft pentru revizuire" />
      <article className="public-page max-w-4xl space-y-10 text-base leading-8">
        <p className="rounded-xl border border-primary/30 bg-primary/10 p-5 font-semibold">
          Acest text este un draft pentru revizuirea ASMM. Nu reprezintă termenii finali și nu trebuie publicat ca atare.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Despre platformă</h2>
          <p>
            asmm.ro prezintă activitatea Asociației Studenților în Medicină Militară și permite, în funcție de
            eveniment, crearea unui cont, înscrierea la ateliere, cumpărarea de bilete și confirmarea prezenței.
            Detaliile unui eveniment, inclusiv programul, capacitatea și prețul, sunt afișate în paginile sale.
          </p>
          <p><strong>De completat înainte de publicare:</strong> datele juridice ale organizatorului și aplicabilitatea acestor termeni pentru fiecare proiect sau eveniment.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Contul tău</h2>
          <p>
            Folosește date corecte la înregistrare și protejează accesul la cont. Poți alege autentificarea prin
            e-mail sau prin Google, dacă această opțiune este disponibilă. Acțiunile care țin de bilete și înscrieri
            sunt asociate contului conectat.
          </p>
          <p><strong>De stabilit înainte de publicare:</strong> condițiile de acces pentru elevi și, dacă este cazul, pentru utilizatorii minori.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Înscrieri, bilete și prezență</h2>
          <p>
            Înscrierile sunt disponibile în limita locurilor și a perioadelor anunțate pentru fiecare activitate.
            Biletele achiziționate apar în cont și pot fi verificate la acces. Codul QR este folosit pentru
            identificarea biletului sau confirmarea prezenței, conform regulilor evenimentului.
          </p>
          <p><strong>De stabilit înainte de publicare:</strong> regulile de transfer al biletelor, pierderea accesului la cod, anularea înscrierilor și schimbările de program.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Plăți și anulări</h2>
          <p>
            Înainte de finalizarea comenzii, platforma afișează prețul și numărul biletelor. Plata este procesată
            prin Stripe. Confirmarea plății și emiterea biletului pot depinde de validarea tranzacției de către
            procesatorul de plăți.
          </p>
          <p><strong>De stabilit înainte de publicare:</strong> politica de anulare și rambursare, termenele, excepțiile aplicabile evenimentelor și modalitatea de contact pentru solicitări. Aceste reguli trebuie afișate și înainte de plată.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Utilizare și asistență</h2>
          <p>
            Nu folosi contul, biletele ori funcțiile de înscriere pentru acces neautorizat sau pentru a împiedica
            folosirea platformei de către alte persoane. Pentru probleme legate de cont și conectare, scrie la{' '}
            <a className="underline" href="mailto:welcome.asmm@gmail.com">welcome.asmm@gmail.com</a>;
            pentru întrebări generale despre asociație, la{' '}
            <a className="underline" href="mailto:office.asmm@gmail.com">office.asmm@gmail.com</a>.
          </p>
          <p><strong>De stabilit înainte de publicare:</strong> procedura de soluționare a reclamațiilor, legea aplicabilă și modul de notificare a modificărilor termenilor.</p>
        </section>
      </article>
    </>
  )
}

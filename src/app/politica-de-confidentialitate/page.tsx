import type { Metadata } from 'next'
import HeaderContent from '@/components/ui/HeaderContent'

export const metadata: Metadata = {
  title: 'Politica de confidențialitate — draft',
  description: 'Draft al informării privind prelucrarea datelor pe platforma ASMM.',
  robots: { index: false, follow: false },
}

export default function PrivacyDraftPage() {
  return (
    <>
      <HeaderContent title="Politica de confidențialitate" kicker="ASMM · Draft pentru revizuire" />
      <article className="public-page max-w-4xl space-y-10 text-base leading-8">
        <p className="rounded-xl border border-primary/30 bg-primary/10 p-5 font-semibold">
          Acest text este un draft pentru revizuirea ASMM. Nu reprezintă politica finală și nu trebuie publicat ca atare.
        </p>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Cine administrează platforma</h2>
          <p>
            Platforma asmm.ro este administrată de Asociația Studenților în Medicină Militară (ASMM).
            Pentru întrebări despre cont sau conectarea cu Google, ne poți scrie la{' '}
            <a className="underline" href="mailto:welcome.asmm@gmail.com">welcome.asmm@gmail.com</a>.
            Pentru solicitări privind datele personale, folosește adresa{' '}
            <a className="underline" href="mailto:office.asmm@gmail.com">office.asmm@gmail.com</a>.
          </p>
          <p><strong>De completat înainte de publicare:</strong> denumirea juridică exactă, sediul și datele de identificare ale operatorului, precum și contactul desemnat pentru protecția datelor, dacă este cazul.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Ce date folosim</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Pentru cont: nume, prenume, adresă de e-mail, tipul de utilizator și identificatorul contului.</li>
            <li>Dacă alegi conectarea cu Google: informațiile de bază ale profilului pe care le autorizezi în ecranul Google, necesare pentru autentificare. Platforma nu solicită acces la Gmail sau Google Drive.</li>
            <li>Pentru evenimente: înscrierile la ateliere, biletele emise, codurile de acces și confirmările de prezență.</li>
            <li>Pentru plăți: suma, moneda, produsul, numărul de bilete și starea tranzacției. Datele cardului sunt introduse în interfața Stripe și nu sunt stocate în baza de date a platformei.</li>
            <li>Pentru funcționare și securitate: date tehnice despre sesiune, cereri și erori. Site-ul include și Google Analytics, Vercel Analytics și Speed Insights.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">În ce scop folosim datele</h2>
          <p>
            Folosim datele pentru a crea și proteja contul, a gestiona înscrieri și bilete, a procesa plăți,
            a confirma prezența la evenimente, a răspunde solicitărilor și a menține platforma sigură și funcțională.
            Datele de analiză ne pot ajuta să înțelegem utilizarea site-ului.
          </p>
          <p><strong>De confirmat înainte de publicare:</strong> temeiul juridic pentru fiecare scop și mecanismul de consimțământ pentru analitice, unde este necesar.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Servicii implicate</h2>
          <p>
            Autentificarea este furnizată prin Clerk și, dacă o alegi, Google. Plățile sunt procesate prin Stripe;
            datele aplicației sunt găzduite cu ajutorul MongoDB Atlas și Vercel. Google Analytics și Vercel
            Analytics pot prelucra date de utilizare. Fiecare serviciu prelucrează doar datele necesare funcției sale,
            potrivit configurației și contractelor aplicabile.
          </p>
          <p><strong>De confirmat înainte de publicare:</strong> rolurile furnizorilor, locațiile de prelucrare și garanțiile pentru transferurile în afara Spațiului Economic European.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold">Păstrare, cookie-uri și drepturi</h2>
          <p>
            Contul folosește tehnologii necesare pentru menținerea sesiunii. Instrumentele de analiză pot folosi
            tehnologii suplimentare. Poți solicita accesul la date, corectarea sau ștergerea lor, restricționarea
            prelucrării, portabilitatea ori opoziția, în condițiile legii, la adresa de contact de mai sus.
            Poți depune și o plângere la autoritatea competentă pentru protecția datelor.
          </p>
          <p><strong>De completat înainte de publicare:</strong> duratele concrete de păstrare, condițiile de ștergere a contului, politica de cookie-uri și autoritatea de supraveghere aplicabilă.</p>
        </section>
      </article>
    </>
  )
}

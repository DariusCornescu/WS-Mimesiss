import { FiLock, FiShield } from 'react-icons/fi'
import { HiOutlineTicket } from 'react-icons/hi2'

interface PaymentShellProps {
  children: React.ReactNode
  eyebrow?: string
  title: string
  description: string
}

export default function PaymentShell({
  children,
  eyebrow = 'ASMM · PLATĂ SECURIZATĂ',
  title,
  description,
}: PaymentShellProps) {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto grid max-w-[1344px] grid-cols-1 items-start gap-10 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-16">
        <aside className="hidden pr-4 pt-6 lg:block" aria-label="Informații despre plată">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Participare ASMM
          </p>
          <h2 className="max-w-xl text-5xl font-bold leading-[1.08] tracking-[-0.045em] xl:text-6xl">
            Alege biletul.<br />
            <span className="text-accent">Noi îl păstrăm în siguranță.</span>
          </h2>
          <p className="mt-7 max-w-lg text-xl leading-relaxed text-muted-foreground">
            Selectează opțiunea potrivită, finalizează plata și găsește biletul direct în contul tău.
          </p>

          <ul className="mt-12 grid max-w-lg list-none gap-7 p-0">
            <li className="flex items-start gap-5">
              <FiShield className="mt-1 h-10 w-10 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold">Plată procesată securizat</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Datele de plată sunt introduse și procesate în mediul securizat Stripe.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-5">
              <HiOutlineTicket className="mt-1 h-10 w-10 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold">Bilet disponibil în cont</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  După confirmare, biletul apare în secțiunea „Biletele mele”.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-5">
              <FiLock className="mt-1 h-10 w-10 flex-shrink-0 text-accent" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-semibold">Confirmare clară</h3>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Vezi imediat dacă plata a fost confirmată sau este încă în curs de verificare.
                </p>
              </div>
            </li>
          </ul>
        </aside>

        <section className="min-w-0 lg:border-l lg:border-border/25 lg:pl-16" aria-labelledby="payment-shell-title">
          <header className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              {eyebrow}
            </p>
            <h1 id="payment-shell-title" className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          </header>

          {children}
        </section>
      </div>
    </div>
  )
}

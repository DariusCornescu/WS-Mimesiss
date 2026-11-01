import Link from 'next/link'
import { FaCheckCircle, FaClock, FaExclamationCircle, FaTimesCircle } from 'react-icons/fa'

type PaymentResultVariant = 'success' | 'pending' | 'cancelled' | 'unverified'

interface PaymentResultAction {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

interface PaymentResultProps {
  variant: PaymentResultVariant
  title: string
  description: string
  detail?: React.ReactNode
  actions: PaymentResultAction[]
  extraAction?: React.ReactNode
}

const resultConfig = {
  success: {
    label: 'Plată confirmată',
    icon: FaCheckCircle,
    iconClassName: 'border-secondary/30 bg-secondary/10 text-secondary',
    role: 'status' as const,
  },
  pending: {
    label: 'Verificare în curs',
    icon: FaClock,
    iconClassName: 'border-accent/30 bg-accent/10 text-accent',
    role: 'status' as const,
  },
  cancelled: {
    label: 'Plată oprită',
    icon: FaTimesCircle,
    iconClassName: 'border-destructive/30 bg-destructive/10 text-destructive',
    role: 'alert' as const,
  },
  unverified: {
    label: 'Plată neconfirmată',
    icon: FaExclamationCircle,
    iconClassName: 'border-destructive/30 bg-destructive/10 text-destructive',
    role: 'alert' as const,
  },
}

export default function PaymentResult({
  variant,
  title,
  description,
  detail,
  actions,
  extraAction,
}: PaymentResultProps) {
  const config = resultConfig[variant]
  const Icon = config.icon

  return (
    <section
      role={config.role}
      aria-labelledby="payment-result-title"
      className="rounded-lg border border-border bg-card p-6 shadow-lg sm:p-8"
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${config.iconClassName}`}>
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        {config.label}
      </p>
      <h2 id="payment-result-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        {description}
      </p>

      {detail && (
        <div className="mt-6 rounded-lg border border-border bg-muted/60 p-4 text-sm leading-relaxed text-foreground">
          {detail}
        </div>
      )}

      <div className="mt-7 grid gap-3">
        {extraAction}
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={action.variant === 'secondary'
              ? 'flex min-h-12 items-center justify-center rounded-lg border border-border bg-background px-4 py-3 text-center font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              : 'flex min-h-12 items-center justify-center rounded-lg border border-accent/50 bg-primary px-4 py-3 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { FaSearch, FaTimes } from 'react-icons/fa'
import DeletePaymentButton from '@/app/admin/payments/DeletePaymentButton'

// Enhanced payment interface with user details
interface PaymentWithUser {
  _id: string
  clerkId: string
  stripeSessionId: string
  stripePaymentIntentId?: string
  amount: number
  currency: string
  ticketId: string
  ticketType: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  createdAt: Date
  updatedAt: Date
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

interface PaymentsListProps {
  payments: PaymentWithUser[]
  ticketCounts: Record<string, number>
}

// Helper functions
function formatCurrency(amount: number, currency: string = 'RON'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const paymentStatus = {
  completed: { label: 'Finalizată', className: 'border-secondary/30 bg-secondary/10 text-secondary' },
  pending: { label: 'În așteptare', className: 'border-accent/30 bg-accent/10 text-accent' },
  failed: { label: 'Eșuată', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
  refunded: { label: 'Rambursată', className: 'border-border bg-muted text-muted-foreground' },
} satisfies Record<PaymentWithUser['status'], { label: string; className: string }>

function PaymentBadges({ payment, ticketCount }: { payment: PaymentWithUser; ticketCount?: number }) {
  const status = paymentStatus[payment.status]

  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-accent">
        {payment.ticketType || 'Tip necunoscut'}
      </span>
      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
        {status.label}
      </span>
      {ticketCount != null && (
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {ticketCount} bilet{ticketCount !== 1 ? 'e' : ''}
        </span>
      )}
    </div>
  )
}


export default function PaymentsList({ payments, ticketCounts }: PaymentsListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter payments based on search term
  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments

    const lowerSearch = searchTerm.toLowerCase()

    return payments.filter((payment) => {
      const userName = payment.user
        ? `${payment.user.firstName} ${payment.user.lastName}`.toLowerCase()
        : ''
      const userEmail = payment.user?.email?.toLowerCase() || ''
      const ticketType = payment.ticketType?.toLowerCase() || ''
      const amount = formatCurrency(payment.amount, payment.currency).toLowerCase()
      const stripeId = payment.stripePaymentIntentId?.toLowerCase() || ''
      const status = paymentStatus[payment.status].label.toLowerCase()

      return (
        userName.includes(lowerSearch) ||
        userEmail.includes(lowerSearch) ||
        ticketType.includes(lowerSearch) ||
        status.includes(lowerSearch) ||
        amount.includes(lowerSearch) ||
        stripeId.includes(lowerSearch)
      )
    })
  }, [payments, searchTerm])

  const resultLabel = `${filteredPayments.length} ${filteredPayments.length === 1 ? 'plată' : 'plăți'}`

  return (
    <section aria-label="Lista plăților">
      <div className="border-b border-border/70 bg-muted/35 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xl">
            <label htmlFor="payment-search" className="sr-only">Caută în plăți</label>
            <FaSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="payment-search"
              type="search"
              placeholder="Caută după participant, email, bilet sau sumă"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-input bg-background/70 py-2 pl-11 pr-12 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-ring/30"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-r-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Șterge căutarea"
              >
                <FaTimes aria-hidden="true" className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">{resultLabel}</p>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <p className="font-medium text-foreground">
            {searchTerm ? 'Nicio plată nu corespunde căutării.' : 'Nu există plăți înregistrate.'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchTerm ? 'Încearcă un nume, un email sau un tip de bilet diferit.' : 'Plățile vor apărea aici după înregistrare.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="grid gap-3 p-4 sm:p-5 xl:hidden">
            {filteredPayments.map((payment) => {
              const userName = payment.user
                ? `${payment.user.firstName} ${payment.user.lastName}`.trim() || 'Participant necunoscut'
                : 'Participant necunoscut'

              return (
                <li key={payment._id} className="rounded-xl border border-border/70 bg-background/35 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{userName}</p>
                      <p className="mt-1 break-all text-sm text-muted-foreground">{payment.user?.email || payment.clerkId}</p>
                    </div>
                    <p className="shrink-0 text-base font-bold text-foreground">{formatCurrency(payment.amount, payment.currency)}</p>
                  </div>

                  <div className="mt-4">
                    <PaymentBadges payment={payment} ticketCount={ticketCounts[payment._id]} />
                  </div>

                  <dl className="mt-4 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Data</dt>
                      <dd className="mt-1 text-sm text-foreground">{formatDate(payment.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">ID Stripe</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-muted-foreground">{payment.stripePaymentIntentId || 'Nedisponibil'}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex justify-end border-t border-border/60 pt-3">
                    <DeletePaymentButton paymentId={payment._id} userName={userName} />
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full divide-y divide-border/70">
              <thead className="bg-muted/45">
                <tr>
                  {['Participant', 'Bilet și status', 'Sumă', 'Data', 'ID Stripe', 'Acțiuni'].map((label) => (
                    <th key={label} scope="col" className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card/45">
                {filteredPayments.map((payment) => {
                  const userName = payment.user
                    ? `${payment.user.firstName} ${payment.user.lastName}`.trim() || 'Participant necunoscut'
                    : 'Participant necunoscut'

                  return (
                    <tr key={payment._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-semibold text-foreground">{userName}</p>
                        <p className="mt-1 max-w-64 break-all text-xs text-muted-foreground">{payment.user?.email || payment.clerkId}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <PaymentBadges payment={payment} ticketCount={ticketCounts[payment._id]} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-foreground">{formatCurrency(payment.amount, payment.currency)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">{formatDate(payment.createdAt)}</td>
                      <td className="px-5 py-4">
                        <p className="max-w-40 truncate font-mono text-xs text-muted-foreground" title={payment.stripePaymentIntentId || undefined}>
                          {payment.stripePaymentIntentId || 'Nedisponibil'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <DeletePaymentButton paymentId={payment._id} userName={userName} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

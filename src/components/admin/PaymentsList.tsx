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
  return new Date(date).toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

      return (
        userName.includes(lowerSearch) ||
        userEmail.includes(lowerSearch) ||
        ticketType.includes(lowerSearch) ||
        amount.includes(lowerSearch) ||
        stripeId.includes(lowerSearch)
      )
    })
  }, [payments, searchTerm])

  return (
    <>
      {/* Search Bar */}
      <div className="px-4 py-3 sm:px-6 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Caută plăți după utilizator, email, tip bilet, status, sumă..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-border rounded-md leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
            />
            {searchTerm && (
              <button
                type='button'
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-foreground text-muted-foreground transition-colors"
                aria-label="Șterge căutarea"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredPayments.length} {filteredPayments.length === 1 ? 'plată' : 'plăți'}
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Utilizator
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tip Bilet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Sumă
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                ID Stripe
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Acțiuni
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  {searchTerm ? 'Nu s-au găsit plăți care să corespundă căutării.' : 'Nu există plăți.'}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {payment.user
                          ? `${payment.user.firstName} ${payment.user.lastName}`.trim() || 'N/A'
                          : 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {payment.user?.email || payment.clerkId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm space-y-1">
                      {payment.ticketType ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {payment.ticketType}
                            </span>
                            {ticketCounts[payment._id] != null && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">
                                {ticketCounts[payment._id]} bilet{ticketCounts[payment._id] !== 1 ? 'e' : ''}
                              </span>
                            )}
                          </div>
                          {payment.ticketId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {payment.ticketId.substring(0, 8)}...
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">N/A</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-muted-foreground max-w-[150px] truncate">
                      {payment.stripePaymentIntentId || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <DeletePaymentButton paymentId={payment._id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

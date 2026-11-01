'use client'

import { FaCreditCard, FaDownload, FaPlus, FaTicketAlt } from 'react-icons/fa'
import PaymentsList from '@/components/admin/PaymentsList'
import Link from 'next/link'
import { escapeCsvCell as escapeCSV } from '@/lib/csv'
import PageIntro from '@/components/ui/PageIntro'

// Define the types again here or import them from a shared types file
interface PaymentStats {
	totalRevenue: number
	totalPayments: number
	ticketTypeCounts: Record<string, number>
}

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

interface PaymentsClientProps {
	stats: PaymentStats
	payments: PaymentWithUser[]
	ticketCounts: Record<string, number>
}

export default function PaymentsClient({ stats, payments, ticketCounts }: PaymentsClientProps) {

	// 1. Move the currency formatter
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('ro-RO', {
			style: 'currency',
			currency: 'RON'
		}).format(amount / 100) // Convert from cents
	}

	// 2. Implement the downloadCSV function
	function downloadCSV() {
		const headers = [
			"ID Plata", "Data Creare", "Status", "Nume", "Prenume", "Email",
			"Tip Bilet", "Suma (RON)", "Moneda", "ID Sesiune Stripe", "ID Plata Stripe"
		];

		const rows = payments.map(p => {
			const row = [
				escapeCSV(p._id),
				escapeCSV(new Date(p.createdAt).toLocaleString('ro-RO')),
				escapeCSV(p.status),
				escapeCSV(p.user?.lastName),
				escapeCSV(p.user?.firstName),
				escapeCSV(p.user?.email),
				escapeCSV(p.ticketType || ''),
				String(p.amount / 100), // Raw number for CSV
				escapeCSV(p.currency),
				escapeCSV(p.stripeSessionId),
				escapeCSV(p.stripePaymentIntentId)
			];
			return row.join(',');
		});

		const csvContent = [headers.join(','), ...rows].join('\n');

		// Add BOM for proper UTF-8 handling in Excel
		const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
		const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.setAttribute('href', url);
		link.setAttribute('download', `raport-plati-asmm-${new Date().toISOString().slice(0, 10)}.csv`);
		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	const issuedTickets = Object.values(ticketCounts).reduce((total, count) => total + count, 0)

	return (
		<div className="space-y-6">
			<PageIntro
				eyebrow="Administrare · Financiar"
				title="Gestionare plăți"
				description="Monitorizează plățile, biletele emise și încasările înregistrate pentru evenimentele ASMM."
				actions={(
					<>
						<button
							type="button"
							onClick={downloadCSV}
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<FaDownload aria-hidden="true" className="h-4 w-4" />
							Descarcă raportul
						</button>
						<Link
							href="/admin/payments/new"
							className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-accent/45 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<FaPlus aria-hidden="true" className="h-4 w-4" />
							Plată nouă
						</Link>
					</>
				)}
			/>

			<section aria-label="Rezumat plăți" className="grid gap-3 sm:grid-cols-3">
				<div className="mimesiss-card flex items-center gap-4 p-5">
					<div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/20 text-accent">
						<FaCreditCard aria-hidden="true" />
					</div>
					<div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Încasări</p><p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p></div>
				</div>
				<div className="mimesiss-card flex items-center gap-4 p-5">
					<div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/20 text-accent">
						<FaCreditCard aria-hidden="true" />
					</div>
					<div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Plăți</p><p className="mt-1 text-xl font-bold text-foreground">{stats.totalPayments}</p></div>
				</div>
				<div className="mimesiss-card flex items-center gap-4 p-5">
					<div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/20 text-accent">
						<FaTicketAlt aria-hidden="true" />
					</div>
					<div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Bilete emise</p><p className="mt-1 text-xl font-bold text-foreground">{issuedTickets}</p></div>
				</div>
			</section>

			<section className="mimesiss-section-card" aria-labelledby="payments-list-title">
				<div className="border-b border-border/70 px-5 py-5 sm:px-6">
					<h2 id="payments-list-title" className="text-xl font-semibold text-foreground">Istoricul plăților</h2>
					<p className="mt-1 text-sm text-muted-foreground">Caută, verifică sau elimină o înregistrare de plată.</p>
				</div>
				<PaymentsList payments={payments} ticketCounts={ticketCounts} />
			</section>
		</div>
	)
}

'use client'

import { FaCreditCard } from 'react-icons/fa'
import PaymentsList from '@/components/admin/PaymentsList'
import Link from 'next/link'

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

		// Helper to safely wrap values in quotes if they contain commas
		const escapeCSV = (str: string | undefined | null) => {
			if (str == null) return '';
			const s = String(str);
			if (s.includes(',') || s.includes('"') || s.includes('\n')) {
				return `"${s.replace(/"/g, '""')}"`;
			}
			return s;
		};

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
		link.setAttribute('download', 'raport-plati-mimesiss-2025.csv');
		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	// 3. Move all JSX here
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Gestionare Plăți</h1>
				<p className="mt-1 text-sm text-muted-foreground">
						Monitorizați și gestionați toate plățile pentru biletele MIMESISS 2025.
					</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Total încasat: <span className="font-semibold text-foreground">{formatCurrency(stats.totalRevenue)}</span>
				</p>

					{/* 4. Add onClick handler to the button */}
					<div className="mt-4 flex items-center space-x-4">
						<button
							type='button'
							onClick={downloadCSV}
							className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
						>
							Descarca Raport Plăți
						</button>

						<Link href="/admin/payments/new" className="text-sm text-primary hover:underline">
							Creează o plată nouă
						</Link>
					</div>
				</div>
			</div>

			{/* Statistics Cards removed */}

			{/* Recent Payments Table */}
			<div className="bg-card shadow border border-border overflow-hidden sm:rounded-lg">
				<div className="px-4 py-5 sm:px-6">
					<h3 className="text-lg leading-6 font-medium text-foreground">Plăți Recente</h3>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
						Lista tuturor plăților efectuate pentru biletele MIMESISS 2025.
					</p>
				</div>

				<PaymentsList payments={payments} ticketCounts={ticketCounts} />

				{payments.length === 0 && (
					<div className="text-center py-12">
						<FaCreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
						<h3 className="mt-2 text-sm font-medium text-foreground">Nicio plată</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							Nu există încă plăți înregistrate în sistem.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
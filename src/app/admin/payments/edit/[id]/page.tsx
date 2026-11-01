import Link from 'next/link'
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa'
import PageIntro from '@/components/ui/PageIntro'

interface NewPaymentPageProps {

	params: Promise<{
		id: string
	}>
}

export default async function EditPaymentPage({ params }: NewPaymentPageProps) {
	const { id } = await params;

	return (
		<div className="space-y-6">
			<PageIntro
				eyebrow="Administrare · Plăți"
				title="Detalii plată"
				description="Consultă identificatorul înregistrării înainte de a reveni la istoricul plăților."
				actions={(
					<Link
						href="/admin/payments"
						className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<FaArrowLeft aria-hidden="true" className="h-4 w-4" />
						Înapoi la plăți
					</Link>
				)}
			/>

			<section className="mimesiss-section-card p-5 sm:p-7" aria-labelledby="payment-record-title">
				<div className="flex items-start gap-4">
					<div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/20 text-accent">
						<FaInfoCircle aria-hidden="true" />
					</div>
					<div className="min-w-0">
						<h2 id="payment-record-title" className="text-xl font-semibold text-foreground">Editarea nu este disponibilă</h2>
						<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
							Pentru protejarea istoricului financiar, o plată salvată nu poate fi modificată din interfață. Poți elimina înregistrarea din listă și crea una nouă dacă datele sunt greșite.
						</p>
						<p className="mt-4 break-all rounded-lg border border-border bg-background/45 px-3 py-2 font-mono text-xs text-muted-foreground">
							ID: {id}
						</p>
					</div>
				</div>
			</section>
		</div>
	)
}


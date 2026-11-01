'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FaArrowLeft, FaTicketAlt } from "react-icons/fa"
import { createTicket } from "../actions"
import PageIntro from "@/components/ui/PageIntro"

export default function NewTicketPage() {
	const [error, setError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()
	const router = useRouter()

	// Handle form submission using Server Action
	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)

		const formData = new FormData(event.currentTarget)
		
		// Extract and parse form data
		const title = formData.get('title') as string
		const description = formData.get('description') as string
		const price = parseFloat(formData.get('price') as string)
		const featuresString = formData.get('features') as string
		const features = featuresString.split(',').map(f => f.trim()).filter(f => f.length > 0)
		const type = formData.get('type') as string
		const enabled = formData.get('enabled') === 'on'
		const category = formData.get('category') as 'workshop' | 'ball'

		const data = {
			title,
			description,
			price,
			features,
			type,
			enabled,
			category: category || 'workshop',
		}

		startTransition(async () => {
			try {
				await createTicket(data)
				router.push('/admin/tickets')
			} catch (err) {
				setError(err instanceof Error ? err.message : 'A apărut o eroare')
			}
		})
	}

  return (
	<div className="space-y-6">
		<PageIntro
			eyebrow="Administrare · Bilete"
			title="Bilet nou"
			description="Configurează un nou tip de bilet, prețul și beneficiile incluse pentru evenimentele ASMM."
			actions={(
				<Link
					href="/admin/tickets"
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<FaArrowLeft aria-hidden="true" className="h-4 w-4" />
					Înapoi la bilete
				</Link>
			)}
		/>

	  <form onSubmit={handleSubmit} aria-busy={isPending} className="space-y-6">

		{error && (
			<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
				{error}
			</div>
		)}

		<div className="mimesiss-section-card p-5 sm:p-7">
			<div className="mb-6 flex items-start gap-4 border-b border-border/70 pb-5">
				<div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-accent/25 bg-primary/20 text-accent">
					<FaTicketAlt aria-hidden="true" />
				</div>
				<div>
					<h2 className="text-xl font-semibold text-foreground">Detaliile biletului</h2>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">Câmpurile marcate sunt obligatorii înainte de publicare.</p>
				</div>
			</div>

			<div className="grid gap-5 md:grid-cols-2">
				<div>
				  <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">
					  Nume bilet <span className="text-destructive">*</span>
				  </label>
				  <input id="title" type="text" name="title" required disabled={isPending} placeholder="Ex.: Participant activ" className="mimesiss-input min-h-12" />
				</div>

				<div>
				  <label htmlFor="type" className="mb-2 block text-sm font-semibold text-foreground">
					  Tip bilet <span className="text-destructive">*</span>
				  </label>
				 <input id="type" type="text" name="type" required disabled={isPending} placeholder="Ex.: VIP" className="mimesiss-input min-h-12" />
				</div>
			</div>

			<div className="mt-5">
			  <label htmlFor="description" className="mb-2 block text-sm font-semibold text-foreground">
				  Descriere <span className="text-destructive">*</span>
			  </label>
			  <textarea id="description" name="description" required disabled={isPending} rows={4} placeholder="Descrierea detaliată a biletului…" className="mimesiss-input" />
			</div>

			<div className="mt-5 grid gap-5 md:grid-cols-2">
				<div>
				  <label htmlFor="price" className="mb-2 block text-sm font-semibold text-foreground">
					  Preț (RON) <span className="text-destructive">*</span>
				  </label>
				  <input id="price" type="number" name="price" required disabled={isPending} min="0" step="0.01" placeholder="120,00" className="mimesiss-input min-h-12" />
				</div>

				<fieldset>
				  <legend className="mb-2 block text-sm font-semibold text-foreground">Categorie bilet <span className="text-destructive">*</span></legend>
				  <div className="grid grid-cols-2 gap-2">
					  {(['workshop', 'ball'] as const).map((category) => (
						  <label key={category} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-foreground transition hover:bg-muted/50">
							  <input type="radio" name="category" value={category} defaultChecked={category === 'workshop'} disabled={isPending} className="h-4 w-4 accent-primary" />
							  {category === 'workshop' ? 'Workshop' : 'Bal'}
						  </label>
					  ))}
				  </div>
				</fieldset>
			</div>

			<div className="mt-5">
			  <label htmlFor="features" className="mb-2 block text-sm font-semibold text-foreground">
				  Caracteristici <span className="text-destructive">*</span>
			  </label>
			  <input id="features" type="text" name="features" required disabled={isPending} placeholder="Acces la conferințe, materiale incluse, certificat" className="mimesiss-input min-h-12" />
			  <p className="mt-2 text-xs leading-5 text-muted-foreground">
				  Separă caracteristicile prin virgulă.
			  </p>
			</div>

			<label className="mt-5 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
			  <input
				  type="checkbox"
				  id="enabled"
				  name="enabled"
				  disabled={isPending}
				  defaultChecked
				  className="h-4 w-4 rounded border-input bg-background accent-primary disabled:opacity-50"
			  />
			  <span className="text-sm font-medium text-foreground">
				  Bilet activ (disponibil pentru cumpărare)
			  </span>
			</label>
			<p className="mt-2 text-xs leading-5 text-muted-foreground">Biletele de tip „Bal” se vând cu cantitate și apar în fluxul dedicat.</p>
		</div>

		<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
		  <Link href="/admin/tickets" aria-disabled={isPending} className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-muted/60 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isPending ? 'pointer-events-none opacity-50' : ''}`}>
			  Anulează
		  </Link>
		  <button 
			  type="submit" 
			  disabled={isPending}
			  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent/45 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
		  >
			  {isPending ? 'Se creează…' : 'Creează biletul'}
		  </button>
		</div>
	  </form>
	</div>
  )
  
}

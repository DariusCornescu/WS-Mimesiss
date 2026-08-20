'use client'

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createTicket } from "../actions"

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
	<div className="max-w-4xl mx-auto px-4 py-8">
	  <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
		<div>
			<h1 className="text-3xl font-bold text-foreground mb-2">Creează un bilet nou</h1>
			<p className="text-muted-foreground">Adaugă un tip nou de bilet pentru eveniment</p>
		</div>

		{error && (
			<div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
				{error}
			</div>
		)}

		<div className="mimesiss-section-card p-6 space-y-6">
			<div>
			  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
				  Nume Bilet <span className="text-destructive">*</span>
			  </label>
			  <input 
				  type="text" 
				  name="title" 
				  required 
				  disabled={isPending}
				  placeholder="ex: Participant Activ"
				  className="mimesiss-input" 
			  />
			</div>

			<div>
			  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
				  Descriere <span className="text-destructive">*</span>
			  </label>
			  <textarea 
				  name="description" 
				  required 
				  disabled={isPending}
				  rows={4}
				  placeholder="Descrierea detaliată a biletului..."
				  className="mimesiss-input" 
			  />
			</div>

			<div>
			  <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
				  Tip Bilet <span className="text-destructive">*</span>
			  </label>
			 <input type="text"
				 name="type"
				 required
				 disabled={isPending}
				 placeholder="ex: VIP"
				 className="mimesiss-input"
			 />
			</div>

			<div>
			  <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
				  Preț (RON) <span className="text-destructive">*</span>
			  </label>
			  <input 
				  type="number" 
				  name="price" 
				  required 
				  disabled={isPending}
				  min="0" 
				  step="0.01"
				  placeholder="120.00"
				  className="mimesiss-input"
			  />
			</div>

			<div>
			  <label htmlFor="features" className="block text-sm font-medium text-foreground mb-2">
				  Caracteristici <span className="text-destructive">*</span>
			  </label>
			  <input 
				  type="text" 
				  name="features" 
				  required 
				  disabled={isPending}
				  placeholder="Acces la conferințe, Materiale incluse, Certificat"
				  className="mimesiss-input"
			  />
			  <p className="mt-1 text-sm text-muted-foreground">
				  Separate caracteristicile prin virgulă
			  </p>
			</div>

			<div className="flex items-center gap-3">
			  <input
				  type="checkbox"
				  id="enabled"
				  name="enabled"
				  disabled={isPending}
				  defaultChecked={true}
				  className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
			  />
			  <label htmlFor="enabled" className="text-sm font-medium text-foreground">
				  Bilet activ (disponibil pentru cumpărare)
			  </label>
			</div>

			<div>
			  <label className="block text-sm font-medium text-foreground mb-2">
				  Categorie bilet <span className="text-destructive">*</span>
			  </label>
			  <div className="flex gap-4">
				  {(['workshop', 'ball'] as const).map((cat) => (
					  <label key={cat} className="flex items-center gap-2 cursor-pointer">
						  <input
							  type="radio"
							  name="category"
							  value={cat}
							  defaultChecked={cat === 'workshop'}
							  disabled={isPending}
							  className="w-4 h-4 text-primary border-input"
						  />
						  <span className="text-sm text-foreground">
							  {cat === 'workshop' ? 'Workshop' : 'Bal'}
						  </span>
					  </label>
				  ))}
			  </div>
			  <p className="mt-1 text-sm text-muted-foreground">
				  Biletele de tip <strong>Bal</strong> se vând cu cantitate și apar pe pagina de bal.
			  </p>
			</div>
		</div>

		<div className="flex gap-3">
		  <button 
			  type="submit" 
			  disabled={isPending}
			  className="mimesiss-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
		  >
			  {isPending ? 'Se creează...' : 'Creează Bilet'}
		  </button>
		  <button 
			  type="button"
			  disabled={isPending}
			  onClick={() => router.back()}
			  className="mimesiss-btn-secondary px-6 disabled:opacity-50"
		  >
			  Anulează
		  </button>
		</div>
	  </form>
	</div>
  )
  
}
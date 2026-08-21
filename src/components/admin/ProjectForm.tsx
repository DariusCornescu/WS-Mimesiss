import Link from 'next/link'

import type { AdminProject } from '@/app/admin/proiecte/actions'

/**
 * Formular partajat între „proiect nou" și „editează proiect". Nu are stare
 * proprie, deci rămâne server component — acțiunea vine ca prop.
 */
export default function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>
  project?: AdminProject
  submitLabel: string
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="mimesiss-card p-6 space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Titlu <span className="text-destructive">*</span>
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={project?.title}
            className="mimesiss-input"
            placeholder="ex. Cursuri & Workshopuri"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-foreground mb-1">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={project?.slug}
            className="mimesiss-input"
            placeholder="se generează din titlu dacă îl lași gol"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Apare în adresă: /proiecte/<span className="font-mono">slug</span>. Diacriticele și
            spațiile se convertesc automat.
          </p>
        </div>

        <div>
          <label htmlFor="kicker" className="block text-sm font-medium text-foreground mb-1">
            Etichetă
          </label>
          <input
            id="kicker"
            name="kicker"
            defaultValue={project?.kicker}
            className="mimesiss-input"
            placeholder="ex. Concurs"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Textul mic de deasupra titlului, pe card.
          </p>
        </div>

        <div>
          <label htmlFor="summary" className="block text-sm font-medium text-foreground mb-1">
            Descriere scurtă <span className="text-destructive">*</span>
          </label>
          <textarea
            id="summary"
            name="summary"
            required
            rows={3}
            defaultValue={project?.summary}
            className="mimesiss-input"
            placeholder="Una-două propoziții, apar pe card."
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Descriere completă
          </label>
          <textarea
            id="description"
            name="description"
            rows={8}
            defaultValue={project?.description}
            className="mimesiss-input"
            placeholder="Textul de pe pagina proiectului. Un rând gol între paragrafe."
          />
        </div>

        <div>
          <label htmlFor="coverImage" className="block text-sm font-medium text-foreground mb-1">
            Imagine
          </label>
          <input
            id="coverImage"
            name="coverImage"
            defaultValue={project?.coverImage}
            className="mimesiss-input"
            placeholder="/old/3.jpeg"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Cale către un fișier din <span className="font-mono">public/</span>. Imaginile de pe
            alte domenii sunt blocate de configurația Next.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
              Stare
            </label>
            <select
              id="status"
              name="status"
              defaultValue={project?.status ?? 'draft'}
              className="mimesiss-input"
            >
              <option value="draft">Ciornă (ascuns)</option>
              <option value="published">Publicat</option>
            </select>
          </div>

          <div>
            <label htmlFor="kind" className="block text-sm font-medium text-foreground mb-1">
              Tip
            </label>
            <select
              id="kind"
              name="kind"
              defaultValue={project?.kind ?? 'standard'}
              className="mimesiss-input"
            >
              <option value="standard">Proiect obișnuit</option>
              <option value="congress">Congres</option>
            </select>
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-foreground mb-1">
              Ordine
            </label>
            <input
              id="order"
              name="order"
              type="number"
              defaultValue={project?.order ?? 0}
              className="mimesiss-input"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="submit" className="mimesiss-btn-primary sm:w-auto sm:px-8">
          {submitLabel}
        </button>
        <Link href="/admin/proiecte" className="mimesiss-btn-secondary sm:w-auto sm:px-8">
          Anulează
        </Link>
      </div>
    </form>
  )
}

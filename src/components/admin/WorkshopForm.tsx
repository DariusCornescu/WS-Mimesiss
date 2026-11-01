'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWorkshop, updateWorkshop } from '@/app/admin/workshops/actions'
import type { AppSettingsPlain } from '@/lib/settings'
import type { Workshop } from '@/types/models'

interface WorkshopFormProps {
  mode: 'create' | 'edit'
  defaultSettings?: AppSettingsPlain
  workshop?: Workshop
}

// Simple CSS spinner component
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
    />
  )
}

export default function WorkshopForm({ mode, workshop, defaultSettings }: WorkshopFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedType, setSelectedType] = useState<'workshop' | 'conferinta'>(workshop?.wsType || 'workshop')
  const router = useRouter()

  const isEdit = mode === 'edit'
  const title = isEdit ? 'Editează workshop-ul' : 'Creează un workshop nou'
  const submitText = isEdit ? 'Actualizează workshop-ul' : 'Creează workshop-ul'
  const loadingText = isEdit ? 'Se actualizează...' : 'Se creează...'
  const successMessage = isEdit ? 'Workshop actualizat cu succes!' : 'Workshop creat cu succes!'

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        setError('')
        setSuccess('')
        
        if (isEdit && workshop) {
          await updateWorkshop(workshop._id?.toString() ?? '', formData)
        } else {
          await createWorkshop(formData)
        }
        
        setSuccess(successMessage)
        
        // Redirect back to admin workshops page after a short delay
        setTimeout(() => {
          router.push('/admin/workshops')
        }, 1500)
        
      } catch (error) {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} workshop:`, error)
        setError(error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} workshop`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isEdit ? 'Modificați informațiile workshop-ului.' : 'Completați informațiile pentru noul workshop.'}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="px-4 py-5 sm:p-6">
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-foreground"
              >
                {success}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Titlu workshop <span aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  defaultValue={workshop?.title || ''}
                  className="mimesiss-input min-h-11"
                  placeholder="ex. Introducere în React"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground">
                Descriere <span aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  required
                  defaultValue={workshop?.description || ''}
                  className="mimesiss-input"
                  placeholder="Descrieți ce vor învăța participanții..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-foreground">
                URL Eveniment
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="url"
                  id="url"
                  defaultValue={workshop?.url || ''}
                  className="mimesiss-input min-h-11"
                  placeholder="Instagram post URL"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-foreground">
                Tip workshop <span aria-hidden="true">*</span>
              </label>
              <div className="mt-1">
                <select 
                  name="type" 
                  id="type"
                  defaultValue={workshop?.wsType || 'workshop'} 
                  className="mimesiss-input min-h-11"
                  onChange={(e) => setSelectedType(e.target.value as 'workshop' | 'conferinta')}
                >
                  <option value="workshop">Workshop</option>
                  <option value="conferinta">Conferință</option>
               </select>
              </div>
            </div>
              

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-foreground">
                  Data
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="date"
                    id="date"
                    defaultValue={workshop?.date?.toString() || ''}
                    className="mimesiss-input min-h-11"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-foreground">
                  Ora
                </label>
                <div className="mt-1">
                  <input
                    type="time"
                    name="time"
                    id="time"
                    defaultValue={workshop?.time?.toString() || ''}
                    className="mimesiss-input min-h-11"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground">
                Locație
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="location"
                  id="location"
                  defaultValue={workshop?.location || ''}
                  className="mimesiss-input min-h-11"
                  placeholder="ex. Sala de conferințe A, Online"
                />
              </div>
            </div>

            <div>
              <label htmlFor="instructor" className="block text-sm font-medium text-foreground">
                Instructor
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="instructor"
                  id="instructor"
                  defaultValue={workshop?.instructor || ''}
                  className="mimesiss-input min-h-11"
                  placeholder="Numele instructorului"
                />
              </div>
            </div>

            <div>
              <label
                id="maxParticipants-label"
                htmlFor={selectedType === 'workshop' ? 'maxParticipants' : undefined}
                className="block text-sm font-medium text-foreground"
              >
                Numărul maxim de participanți {selectedType === 'workshop' && <span aria-hidden="true">*</span>}
              </label>
              <div className="mt-1">
                {selectedType === 'conferinta' ? (
                  <div
                    aria-labelledby="maxParticipants-label"
                    className="mimesiss-input min-h-11 bg-muted flex items-center justify-between"
                  >
                    <span className="text-muted-foreground">Nelimitat (Conferință)</span>
                    <input type="hidden" name="maxParticipants" value="999999" />
                  </div>
                ) : (
                  <input
                    type="number"
                    name="maxParticipants"
                    id="maxParticipants"
                    aria-describedby="maxParticipants-hint"
                    required
                    min={isEdit && workshop ? workshop.currentParticipants : 1}
                    max="1000"
                    defaultValue={workshop?.maxParticipants || defaultSettings?.defaultMaxParticipants || 30}
                    className="mimesiss-input min-h-11"
                  />
                )}
              </div>
              <p id="maxParticipants-hint" className="mt-1 text-sm text-muted-foreground">
                {selectedType === 'conferinta' 
                  ? 'Conferințele au locuri nelimitate'
                  : isEdit && workshop 
                    ? `Valoare minimă: ${workshop.currentParticipants} (participanți actuali)`
                    : `Numărul maxim de participanți permis pentru acest workshop. Implicit: ${defaultSettings?.defaultMaxParticipants || 20}`
                }
              </p>
            </div>

            {isEdit && workshop && (
              <div className="rounded-lg border border-border bg-muted/60 p-4">
                <h4 className="mb-3 text-sm font-semibold text-foreground">Statistici workshop</h4>
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">Participanți actuali:</span>
                    <span className="ml-2 font-medium">{workshop.currentParticipants}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stare:</span>
                    <span className="ml-2 font-medium capitalize">{workshop.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="ml-2 font-medium">{workshop.instructor}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/workshops"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Anulează
              </Link>
              <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && <Spinner />}
                {isPending ? loadingText : submitText}
              </button>
            </div>
          </form>

          <div className="py-4">
            <p className="text-xs text-muted-foreground">
              * Câmpurile marcate cu asterisc sunt obligatorii.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

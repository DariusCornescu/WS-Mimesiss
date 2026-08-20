'use client'

import { useState, useTransition, useId } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createWorkshop, updateWorkshop } from '@/app/admin/workshops/actions'
import type { IAppSettings } from '@/models/AppSettings'
import type { Workshop } from '@/types/models'

interface WorkshopFormProps {
  mode: 'create' | 'edit'
  defaultSettings?: IAppSettings
  workshop?: Workshop
}

// Simple CSS spinner component
function Spinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  )
}

export default function WorkshopForm({ mode, workshop, defaultSettings }: WorkshopFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedType, setSelectedType] = useState<'workshop' | 'conferinta'>(workshop?.wsType || 'workshop')
  const router = useRouter()
  const maxParticipantsId = useId()

  const isEdit = mode === 'edit'
  const title = isEdit ? 'Editează Workshop' : 'Creează Workshop Nou'
  const submitText = isEdit ? 'Actualizează Workshop' : 'Creează Workshop'
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

      <div className="bg-card shadow border border-border sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Titlu Workshop *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id={useId()}
                  required
                  defaultValue={workshop?.title || ''}
                  className="mimesiss-input"
                  placeholder="ex. Introducere în React"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground">
                Descriere *
              </label>
              <div className="mt-1">
                <textarea
                  name="description"
                  id={useId()}
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
                  id={useId()}
                  defaultValue={workshop?.url || ''}
                  className="mimesiss-input"
                  placeholder="Instagram post URL"
                />
              </div>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-foreground">
                Tip workshop *
              </label>
              <div className="mt-1">
                <select 
                  name="type" 
                  id={useId()} 
                  defaultValue={workshop?.wsType || 'workshop'} 
                  className="mimesiss-input"
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
                    id={useId()}
                    defaultValue={workshop?.date?.toString() || ''}
                    className="mimesiss-input"
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
                    id={useId()}
                    defaultValue={workshop?.time?.toString() || ''}
                    className="mimesiss-input"
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
                  id={useId()}
                  defaultValue={workshop?.location || ''}
                  className="mimesiss-input"
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
                  id={useId()}
                  defaultValue={workshop?.instructor || ''}
                  className="mimesiss-input"
                  placeholder="Numele instructorului"
                />
              </div>
            </div>

            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-foreground">
                Numărul maxim de participanți {selectedType === 'workshop' ? '*' : ''}
              </label>
              <div className="mt-1">
                {selectedType === 'conferinta' ? (
                  <div className="mimesiss-input bg-muted flex items-center justify-between">
                    <span className="text-muted-foreground">Nelimitat (Conferință)</span>
                    <input type="hidden" name="maxParticipants" value="999999" />
                  </div>
                ) : (
                  <input
                    type="number"
                    name="maxParticipants"
                    id={maxParticipantsId}
                    required
                    min={isEdit && workshop ? workshop.currentParticipants : 1}
                    max="1000"
                    defaultValue={workshop?.maxParticipants || defaultSettings?.defaultMaxParticipants || 30}
                    className="mimesiss-input"
                  />
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedType === 'conferinta' 
                  ? 'Conferințele au locuri nelimitate'
                  : isEdit && workshop 
                    ? `Valoare minimă: ${workshop.currentParticipants} (participanți actuali)`
                    : `Numărul maxim de participanți permis pentru acest workshop. Implicit: ${defaultSettings?.defaultMaxParticipants || 20}`
                }
              </p>
            </div>

            {isEdit && workshop && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="text-sm font-medium text-foreground mb-2">Workshop Statistics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Participants:</span>
                    <span className="ml-2 font-medium">{workshop.currentParticipants}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium capitalize">{workshop.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Instructor:</span>
                    <span className="ml-2 font-medium">{workshop.instructor}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Link
                href="/admin/workshops"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium"
              >
                Anulează
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

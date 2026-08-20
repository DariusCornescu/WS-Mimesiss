'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { IAppSettings } from '@/models/AppSettings'
import { updateSettings, resetSettings } from '@/app/admin/settings/actions'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

interface SettingsFormProps {
  initialSettings: IAppSettings
}

// Simple CSS spinner component
function Spinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  )
}

// Helper to format date for datetime-local input
// Reads stored UTC time and displays it as-is (since we store the literal time as UTC)
function formatDateTimeLocal(date: Date | string | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  // Use UTC methods because we store "20:00" as "20:00 UTC" (not as Romania time converted to UTC)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hours = String(d.getUTCHours()).padStart(2, '0')
  const minutes = String(d.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        setError('')
        setSuccess('')
        
        await updateSettings(formData)
        setSuccess('Setările au fost actualizate cu succes!')
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000)
        
      } catch (error) {
        console.error('Error updating settings:', error)
        setError(error instanceof Error ? error.message : 'Failed to update settings')
      }
    })
  }

  async function handleReset() {
    if (!confirm('Sunteți sigur că doriți să resetați toate setările la valorile implicite?')) {
      return
    }

    startTransition(async () => {
      try {
        setError('')
        setSuccess('')
        
        await resetSettings()
        setSuccess('Setările au fost resetate la valorile implicite!')
        
        // Refresh the page after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1500)
        
      } catch (error) {
        console.error('Error resetting settings:', error)
        setError(error instanceof Error ? error.message : 'Failed to reset settings')
      }
    })
  }

  return (
    <div className="p-6">
      <form action={handleSubmit} className="space-y-8">
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

        {/* Workshop Settings */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
              Setări Workshop-uri
            </h3>
          </div>

          <div className="space-y-6">
            <ToggleSwitch
              name="globalRegistrationEnabled"
              label="Permite înregistrarea globală la workshop-uri"
              description="Când este activat, utilizatorii se pot înregistra la workshop-uri. Când este dezactivat, înregistrările sunt blocate global."
              defaultChecked={initialSettings.globalRegistrationEnabled}
            />

            <ToggleSwitch
              name="paymentsEnabled"
              label="Permite plățile pentru workshop-uri"
              description="Când este activat, utilizatorii pot efectua plăți pentru workshop-uri."
              defaultChecked={initialSettings.paymentsEnabled}
            />

            <ToggleSwitch
              name="workshopVisibleToPublic"
              label="Workshop-uri vizibile publicului"
              description="Când este activat, workshop-urile sunt vizibile publicului."
              defaultChecked={initialSettings.workshopVisibleToPublic}
            />

            <ToggleSwitch
              name="allowCancelRegistration"
              label="Permite anularea înregistrărilor"
              description="Când este activat, utilizatorii pot anula propriile înregistrări la workshop-uri."
              defaultChecked={initialSettings.allowCancelRegistration}
            />

            <div>
              <label htmlFor="registrationStartTime" className="block text-sm font-medium text-foreground">
                Data de începere a înregistrărilor la workshop-uri
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  name="registrationStartTime"
                  defaultValue={formatDateTimeLocal(initialSettings.registrationStartTime)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Înregistrările la workshop-uri (nu conferințe) vor fi deschise începând cu această dată. Lăsați gol pentru disponibilitate imediată.
              </p>
            </div>

            <div>
              <label htmlFor="registrationDeadline" className="block text-sm font-medium text-foreground">
                Data limită pentru înregistrări la workshop-uri
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  defaultValue={formatDateTimeLocal(initialSettings.registrationDeadline)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Înregistrările la workshop-uri (nu conferințe) vor fi închise automat după această dată. Lăsați gol pentru nelimitat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="defaultMaxParticipants" className="block text-sm font-medium text-foreground">
                Participanți maximi implicit
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="defaultMaxParticipants"
                  min="1"
                  max="1000"
                  defaultValue={initialSettings.defaultMaxParticipants}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ball (Gala) Settings */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
              Mod Eveniment &amp; Setări Bal
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comutați între modul Workshop (bilete individuale) și modul Bal (bilete multiple cu cantitate).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mod activ
            </label>
            <div className="flex gap-3">
              {(['workshops', 'ball'] as const).map((mode) => (
                <label
                  key={mode}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="eventMode"
                    value={mode}
                    defaultChecked={initialSettings.eventMode === mode || (!initialSettings.eventMode && mode === 'workshops')}
                    className="w-4 h-4 text-primary border-input focus:ring-primary"
                  />
                  <span className="text-sm text-foreground capitalize">
                    {mode === 'workshops' ? 'Workshop-uri' : 'Bal'}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <strong>Workshop-uri</strong> — pagina de plată și dashboard-ul utilizatorului arată biletele pentru conferință/workshop.
              <br />
              <strong>Bal</strong> — pagina de plată arată biletele de bal cu selector de cantitate.
            </p>
          </div>

          <div>
            <label htmlFor="ballMaxTicketsPerUser" className="block text-sm font-medium text-foreground">
              Număr maxim de bilete de bal per utilizator
            </label>
            <div className="mt-1 max-w-xs">
              <input
                type="number"
                name="ballMaxTicketsPerUser"
                min="1"
                max="50"
                defaultValue={initialSettings.ballMaxTicketsPerUser ?? 2}
                className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="ballTicketAvailableFrom" className="block text-sm font-medium text-foreground">
                Bilete de bal disponibile începând cu
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  name="ballTicketAvailableFrom"
                  defaultValue={formatDateTimeLocal(initialSettings.ballTicketAvailableFrom)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Lăsați gol pentru disponibilitate imediată.</p>
            </div>

            <div>
              <label htmlFor="ballTicketAvailableTo" className="block text-sm font-medium text-foreground">
                Vânzare bilete de bal încheiată pe
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  name="ballTicketAvailableTo"
                  defaultValue={formatDateTimeLocal(initialSettings.ballTicketAvailableTo)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Lăsați gol pentru nelimitat.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-border">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Resetează la implicit
          </button>
          
          <button
            type="submit"
            disabled={isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Spinner />}
            {isPending ? 'Se salvează...' : 'Salvează setările'}
          </button>
        </div>
      </form>
    </div>
  )
}

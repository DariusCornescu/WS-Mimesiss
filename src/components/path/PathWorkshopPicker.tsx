'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FaCheck, FaClock, FaMapMarkerAlt, FaUserMd } from 'react-icons/fa'
import { choosePathWorkshop } from '@/app/dashboard/workshops/actions'
import type { PathChoiceItem } from '@/lib/path-choice'

interface PathWorkshopPickerProps {
  items: PathChoiceItem[]
  chosenCount: number
  limit: number
  /** Choosing is open and the participant holds a ticket. */
  canChoose: boolean
  canCancel: boolean
}

const dayFormat = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

function dayLabel(day: string) {
  const label = dayFormat.format(new Date(`${day}T00:00:00Z`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Why a workshop cannot be picked right now, or null when it can. */
function blockedReason(item: PathChoiceItem, limitReached: boolean): string | null {
  if (!item.workshopId) return 'În curând'
  if (item.seatsLeft === 0) return 'Complet'
  if (item.clashes) return 'Se suprapune'
  if (limitReached) return 'Limită atinsă'
  return null
}

export default function PathWorkshopPicker({ items, chosenCount, limit, canChoose, canCancel }: PathWorkshopPickerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const days = [...new Set(items.map(item => item.day).filter((day): day is string => !!day))].sort()
  const [day, setDay] = useState<string | null>(null)
  const visible = day ? items.filter(item => item.day === day) : items
  const limitReached = chosenCount >= limit

  function act(item: PathChoiceItem, action: 'register' | 'cancel') {
    if (!item.workshopId) return
    const workshopId = item.workshopId
    setError(null)
    setBusyId(workshopId)
    startTransition(async () => {
      const result = await choosePathWorkshop(workshopId, action)
      if (!result.success) setError(result.error)
      // Seats move while the page is open, so refresh after a refusal too.
      router.refresh()
      setBusyId(null)
    })
  }

  return (
    <div className="space-y-5">
      {limit > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/85 p-5">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: limit }, (_, index) => (
              <span key={index} className={`h-1.5 flex-1 rounded-full ${index < chosenCount ? 'bg-accent' : 'bg-muted'}`} />
            ))}
          </div>
          <p className="mt-3 text-sm font-medium text-foreground" role="status">
            {chosenCount} din {limit} alese{limitReached ? ' · ai terminat' : ''}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {days.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrează după zi">
          {[null, ...days].map(option => (
            <button
              key={option ?? 'all'}
              type="button"
              aria-pressed={day === option}
              onClick={() => setDay(option)}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${day === option ? 'border-secondary bg-secondary text-secondary-foreground' : 'border-border bg-background text-foreground hover:bg-muted'}`}
            >
              {option ? dayLabel(option) : 'Toate'}
            </button>
          ))}
        </div>
      )}

      <ul className="grid gap-4 lg:grid-cols-2">
        {visible.map(item => {
          const reason = item.chosen ? null : blockedReason(item, limitReached)
          const busy = pending && busyId === item.workshopId
          const taken = item.seats !== null && item.seatsLeft !== null ? item.seats - item.seatsLeft : 0
          return (
            <li key={item.slug} className={`flex flex-col gap-4 rounded-xl border p-5 ${item.chosen ? 'border-accent bg-accent/10' : 'border-border/60 bg-card/85'}`}>
              <div className="flex gap-3">
                {item.image && (
                  <Image src={item.image} alt="" width={48} height={48} className="h-12 w-12 flex-none rounded-full border border-border object-cover" />
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-snug text-foreground">{item.title}</h2>
                  <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <FaUserMd aria-hidden="true" className="mt-1 h-3 w-3 flex-none" />
                    <span>{item.doctors.join(' · ')}</span>
                  </p>
                </div>
              </div>

              {(item.day || item.time || item.location) && (
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {(item.day || item.time) && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaClock aria-hidden="true" className="h-3 w-3" />
                      {[item.day ? dayLabel(item.day) : null, item.time].filter(Boolean).join(' · ')}
                    </span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaMapMarkerAlt aria-hidden="true" className="h-3 w-3" />
                      {item.location}
                    </span>
                  )}
                </p>
              )}

              <div className="mt-auto space-y-3">
                {item.seats !== null && item.seatsLeft !== null && (
                  <div>
                    <div className="h-1 rounded-full bg-muted" aria-hidden="true">
                      <div className="h-1 rounded-full bg-accent" style={{ width: `${Math.round((taken / item.seats) * 100)}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {item.seats === null || item.seatsLeft === null
                      ? 'Locurile se anunță în curând'
                      : item.seatsLeft === 0
                        ? 'Niciun loc liber'
                        : `${item.seatsLeft} ${item.seatsLeft === 1 ? 'loc rămas' : 'locuri rămase'} din ${item.seats}`}
                  </p>
                  {item.chosen ? (
                    canChoose && canCancel ? (
                      <button
                        type="button"
                        onClick={() => act(item, 'cancel')}
                        disabled={pending}
                        aria-busy={busy}
                        aria-label={`Renunță la ${item.title}`}
                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent px-4 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FaCheck aria-hidden="true" className="h-3 w-3" />
                        {busy ? 'Se salvează…' : 'Ales · renunță'}
                      </button>
                    ) : (
                      <span className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-accent">
                        <FaCheck aria-hidden="true" className="h-3 w-3" /> Ales
                      </span>
                    )
                  ) : canChoose ? (
                    <button
                      type="button"
                      onClick={() => act(item, 'register')}
                      disabled={pending || reason !== null}
                      aria-busy={busy}
                      aria-label={reason ? `${reason}: ${item.title}` : `Alege ${item.title}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-accent/50 bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:border-border disabled:bg-transparent disabled:text-muted-foreground"
                    >
                      {busy ? 'Se salvează…' : reason ?? 'Alege'}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

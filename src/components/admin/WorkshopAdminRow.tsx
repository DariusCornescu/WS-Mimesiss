'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaLink,
  FaMapMarkerAlt,
  FaTimesCircle,
  FaUser,
  FaUsers,
} from 'react-icons/fa'
import type { UserWithAttendance, Workshop } from '@/types/models'
import DeleteWorkshopButton from '@/components/admin/DeleteWorkshopButton'
import { RemoveUserButton } from '@/components/admin/RemoveUserButton'

interface WorkshopAdminRowProps {
  registrations: UserWithAttendance[]
  workshop: Workshop
}

export default function WorkshopAdminRow({ workshop, registrations }: WorkshopAdminRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const registrationsId = useId()
  const workshopId = workshop._id?.toString() || workshop.id || ''
  const registrationCount = registrations.length

  return (
    <li className="overflow-hidden rounded-xl border border-border/60 bg-card/90 shadow-lg shadow-background/10">
      <article aria-labelledby={`workshop-${workshopId}`}>
        <div className="p-4 sm:p-6">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={`workshop-${workshopId}`} className="text-lg font-semibold text-foreground sm:text-xl">
                  {workshop.title}
                </h2>
                <span className="inline-flex min-h-7 items-center rounded-full border border-accent/30 bg-accent/10 px-3 text-xs font-semibold uppercase tracking-wide text-accent">
                  {workshop.wsType || 'N/A'}
                </span>
                {workshop.url && (
                  <Link
                    href={workshop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Deschide pagina workshop-ului ${workshop.title} într-o filă nouă`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-accent transition-colors hover:bg-accent/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <FaLink aria-hidden="true" className="h-4 w-4" />
                  </Link>
                )}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {workshop.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                href={`/admin/workshops/edit/${workshopId}`}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent/40 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <FaEdit aria-hidden="true" className="mr-2 h-4 w-4" />
                Editează
              </Link>
              <DeleteWorkshopButton workshopId={workshopId} workshopTitle={workshop.title} />
            </div>
          </header>

          <dl className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-4">
            {workshop.date && (
              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-3">
                <FaCalendarAlt aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-accent" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data</dt>
                  <dd className="mt-1 break-words text-foreground">
                    {new Date(workshop.date).toLocaleDateString('ro-RO')} la {workshop.time}
                  </dd>
                </div>
              </div>
            )}
            {workshop.location && (
              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-3">
                <FaMapMarkerAlt aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-accent" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Locație</dt>
                  <dd className="mt-1 break-words text-foreground">{workshop.location}</dd>
                </div>
              </div>
            )}
            <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-3">
              <FaUsers aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-accent" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Participanți</dt>
                <dd className="mt-1 text-foreground">
                  {workshop.wsType === 'conferinta'
                    ? `${workshop.currentParticipants || 0} (nelimitat)`
                    : `${workshop.currentParticipants || 0}/${workshop.maxParticipants}`}
                </dd>
              </div>
            </div>
            {workshop.instructor && (
              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-border/50 bg-background/40 p-3">
                <FaUser aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-accent" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instructor</dt>
                  <dd className="mt-1 break-words text-foreground">{workshop.instructor}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        <div className="border-t border-border/60 bg-background/20 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setIsExpanded((expanded) => !expanded)}
            aria-expanded={isExpanded}
            aria-controls={registrationsId}
            className="flex min-h-11 w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span>Participanți înregistrați ({registrationCount})</span>
            {isExpanded ? (
              <FaChevronUp aria-hidden="true" className="h-4 w-4 flex-none text-accent" />
            ) : (
              <FaChevronDown aria-hidden="true" className="h-4 w-4 flex-none text-accent" />
            )}
          </button>

          {isExpanded && (
            <div id={registrationsId} className="pb-3 pt-2">
              {registrationCount > 0 ? (
                <ul className="grid gap-3 lg:grid-cols-2">
                  {registrations.map((user) => {
                    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email

                    return (
                      <li key={user._id} className="rounded-lg border border-border/60 bg-card p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground">{userName}</p>
                            <a
                              href={`mailto:${user.email}`}
                              className="mt-1 inline-block break-all text-sm text-muted-foreground underline-offset-4 hover:text-accent hover:underline"
                            >
                              {user.email}
                            </a>
                            <div className="mt-3">
                              {user.attendance?.confirmed ? (
                                <span className="inline-flex items-center gap-2 rounded-full border border-secondary/35 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                                  <FaCheckCircle aria-hidden="true" className="h-4 w-4" />
                                  Prezență confirmată
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold text-muted-foreground">
                                  <FaTimesCircle aria-hidden="true" className="h-4 w-4" />
                                  Prezență neconfirmată
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                            <Link
                              href={`/admin/attendance/${user.clerkId}`}
                              className="inline-flex min-h-11 items-center justify-center rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              Gestionează prezența
                            </Link>
                            <RemoveUserButton
                              userId={user.clerkId}
                              workshopId={workshopId}
                              userName={userName}
                            />
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  Niciun participant înregistrat.
                </p>
              )}
            </div>
          )}
        </div>
      </article>
    </li>
  )
}

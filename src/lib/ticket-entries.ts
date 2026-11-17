/**
 * How many times a ticket lets its holder in, and how many are left.
 *
 * A ticket with workshop access covers one entry per workshop it includes
 * (the base number plus any add-on places). Every other ticket is single
 * use, as before. No database access here, so it can run anywhere.
 */
export interface TicketEntries {
  /** Workshops the ticket covers; null for a ticket without workshop access. */
  workshops: number | null
  /** Of those, how many come from an add-on. */
  extraWorkshops: number
  allowed: number
  used: number
  remaining: number
}

export function ticketEntries(
  ticket: { status: string; entriesUsed?: number | null },
  workshops: number | null,
  extraWorkshops = 0,
): TicketEntries {
  const allowed = workshops ?? 1
  // Tickets marked used before entries were counted have no counter.
  const counted = typeof ticket.entriesUsed === 'number' ? ticket.entriesUsed : ticket.status === 'used' ? allowed : 0
  const used = Math.max(0, Math.min(counted, allowed))
  const remaining = ticket.status === 'cancelled' ? 0 : allowed - used
  return { workshops, extraWorkshops: workshops === null ? 0 : extraWorkshops, allowed, used, remaining }
}

/** "2 workshopuri", or "3 workshopuri (include 1 suplimentar)". */
export function workshopsLabel(entries: Pick<TicketEntries, 'workshops' | 'extraWorkshops'>): string | null {
  if (entries.workshops === null) return null
  const base = `${entries.workshops} ${entries.workshops === 1 ? 'workshop' : 'workshopuri'}`
  return entries.extraWorkshops > 0 ? `${base} (include ${entries.extraWorkshops} suplimentar${entries.extraWorkshops === 1 ? '' : 'e'})` : base
}

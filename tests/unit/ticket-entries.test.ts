import { describe, expect, it } from 'vitest'
import { ticketEntries, workshopsLabel } from '@/lib/ticket-entries'

describe('ticketEntries', () => {
  it('keeps a ticket without workshop access single use', () => {
    expect(ticketEntries({ status: 'active', entriesUsed: 0 }, null)).toMatchObject({ workshops: null, allowed: 1, used: 0, remaining: 1 })
    expect(ticketEntries({ status: 'used', entriesUsed: 1 }, null)).toMatchObject({ used: 1, remaining: 0 })
  })

  it('gives one entry per workshop the ticket covers', () => {
    expect(ticketEntries({ status: 'active', entriesUsed: 1 }, 2)).toMatchObject({ workshops: 2, extraWorkshops: 0, allowed: 2, used: 1, remaining: 1 })
    expect(ticketEntries({ status: 'active', entriesUsed: 1 }, 3, 1)).toMatchObject({ workshops: 3, extraWorkshops: 1, allowed: 3, remaining: 2 })
  })

  it('reads tickets issued before entries were counted from their status', () => {
    expect(ticketEntries({ status: 'active' }, 2)).toMatchObject({ used: 0, remaining: 2 })
    expect(ticketEntries({ status: 'used' }, 2)).toMatchObject({ used: 2, remaining: 0 })
    expect(ticketEntries({ status: 'used', entriesUsed: null }, null)).toMatchObject({ used: 1, remaining: 0 })
  })

  it('reopens a used-up ticket when an add-on raises what it covers', () => {
    expect(ticketEntries({ status: 'used', entriesUsed: 2 }, 3, 1)).toMatchObject({ used: 2, remaining: 1 })
  })

  it('leaves nothing on a cancelled ticket and never reports more used than allowed', () => {
    expect(ticketEntries({ status: 'cancelled', entriesUsed: 0 }, 3, 1).remaining).toBe(0)
    expect(ticketEntries({ status: 'used', entriesUsed: 3 }, 2)).toMatchObject({ used: 2, remaining: 0 })
  })
})

describe('workshopsLabel', () => {
  it('names the workshops and marks the add-on', () => {
    expect(workshopsLabel({ workshops: null, extraWorkshops: 0 })).toBeNull()
    expect(workshopsLabel({ workshops: 2, extraWorkshops: 0 })).toBe('2 workshopuri')
    expect(workshopsLabel({ workshops: 3, extraWorkshops: 1 })).toBe('3 workshopuri (include 1 suplimentar)')
    expect(workshopsLabel({ workshops: 4, extraWorkshops: 2 })).toBe('4 workshopuri (include 2 suplimentare)')
  })
})

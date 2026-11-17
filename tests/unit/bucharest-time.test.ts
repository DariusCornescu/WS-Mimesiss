import { describe, expect, it } from 'vitest'
import { describeBucharestTime, formatBucharestLocal, parseBucharestLocal } from '@/lib/bucharest-time'

describe('Romanian wall-clock time for admin date fields', () => {
  it('reads a winter time as UTC+2', () => {
    expect(parseBucharestLocal('2026-11-18T20:00')?.toISOString()).toBe('2026-11-18T18:00:00.000Z')
  })

  it('reads a summer time as UTC+3', () => {
    expect(parseBucharestLocal('2026-07-01T20:00')?.toISOString()).toBe('2026-07-01T17:00:00.000Z')
  })

  it('handles the hours around the daylight-saving changes', () => {
    // Clocks go back at 04:00 on 25 October 2026 and forward at 03:00 on 29 March 2026.
    expect(parseBucharestLocal('2026-10-25T05:00')?.toISOString()).toBe('2026-10-25T03:00:00.000Z')
    expect(parseBucharestLocal('2026-03-29T02:59')?.toISOString()).toBe('2026-03-29T00:59:00.000Z')
    expect(parseBucharestLocal('2026-03-29T04:00')?.toISOString()).toBe('2026-03-29T01:00:00.000Z')
  })

  it('shows a stored instant back as the time that was typed', () => {
    for (const value of ['2026-11-18T20:00', '2026-07-01T00:05', '2026-12-31T23:59']) {
      expect(formatBucharestLocal(parseBucharestLocal(value))).toBe(value)
    }
  })

  it('treats empty and malformed input as no date', () => {
    expect(parseBucharestLocal('')).toBeNull()
    expect(parseBucharestLocal(null)).toBeNull()
    expect(parseBucharestLocal('18.11.2026 20:00')).toBeNull()
    expect(parseBucharestLocal('2026-13-40T99:99')).toBeNull()
    expect(formatBucharestLocal(null)).toBe('')
    expect(formatBucharestLocal('nu e dată')).toBe('')
  })

  it('describes the opening time for participants in Romanian time', () => {
    expect(describeBucharestTime('2026-11-18T18:00:00.000Z')).toBe('18 noiembrie 2026 la 20:00')
  })
})

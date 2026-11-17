/**
 * Admin forms use <input type="datetime-local">, which carries no time zone.
 * Organisers think in Romanian time, so that value is always read and shown
 * as Europe/Bucharest wall-clock time, whatever zone the server or the
 * admin's browser happens to be in.
 */
const ZONE = 'Europe/Bucharest'

const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE, hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
})

function wallClock(date: Date) {
  const parts: Record<string, string> = {}
  for (const part of partsFormat.formatToParts(date)) parts[part.type] = part.value
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

/** "2026-11-18T20:00" (Romanian time) → the instant it denotes, or null. */
export function parseBucharestLocal(value: string | null | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const asUtc = Date.parse(value + ':00.000Z')
  if (Number.isNaN(asUtc)) return null
  // Shift by the zone offset in force at that moment; a second pass settles
  // the hours next to a daylight-saving change.
  let instant = asUtc
  for (let pass = 0; pass < 2; pass++) {
    const shown = Date.parse(wallClock(new Date(instant)) + ':00.000Z')
    instant += asUtc - shown
  }
  return new Date(instant)
}

/** An instant → "2026-11-18T20:00" in Romanian time, for datetime-local inputs. */
export function formatBucharestLocal(value: Date | string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : wallClock(date)
}

const displayFormat = new Intl.DateTimeFormat('ro-RO', {
  timeZone: ZONE, day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

/** An instant → "18 noiembrie 2026 la 20:00" for participants. */
export function describeBucharestTime(value: Date | string): string {
  return displayFormat.format(new Date(value)).replace(', ', ' la ')
}

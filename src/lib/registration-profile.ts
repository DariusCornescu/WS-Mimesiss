import type { UserType } from '@/types/models'

export function isUserType(value: unknown): value is UserType {
  return value === 'student' || value === 'elev' || value === 'rezident'
}

export function registrationProfile(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const { firstName, lastName, userType } = value as Record<string, unknown>
  if (typeof firstName !== 'string' || typeof lastName !== 'string' || !isUserType(userType)) return null
  const first = firstName.trim()
  const last = lastName.trim()
  if (!first || !last || first.length > 100 || last.length > 100) return null
  return { firstName: first, lastName: last, userType }
}

/** Extra details asked on the profile page. Phone and institution are needed to buy a ticket. */
export interface ProfileDetails {
  phone: string
  institution: string
  studyUnit: string | null
  studyYear: number | null
  city: string | null
}

const STUDY_YEARS: Record<UserType, readonly number[]> = {
  student: [1, 2, 3, 4, 5, 6],
  rezident: [1, 2, 3, 4, 5, 6],
  elev: [9, 10, 11, 12],
}

/** Years (or school classes) a participant of this category can pick. */
export function studyYears(userType: UserType): readonly number[] {
  return STUDY_YEARS[userType]
}

/** "0722 123 456", "+40 (722) 123-456" → digits with an optional leading +, or null. */
export function normalizePhone(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const compact = value.replace(/[\s().-]/g, '')
  return /^\+?\d{9,15}$/.test(compact) ? compact : null
}

function text(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length > max) return undefined
  return trimmed || null
}

/**
 * Validates the extra details for a participant of the given category.
 * Returns null when the phone or institution is missing or anything is
 * malformed; optional fields left empty come back as null.
 */
export function profileDetails(value: unknown, userType: UserType): ProfileDetails | null {
  if (!value || typeof value !== 'object') return null
  const input = value as Record<string, unknown>
  const phone = normalizePhone(input.phone)
  const institution = text(input.institution, 150)
  const studyUnit = text(input.studyUnit, 150)
  const city = text(input.city, 100)
  if (!phone || !institution || institution.length < 2 || studyUnit === undefined || city === undefined) return null
  let studyYear: number | null = null
  if (input.studyYear !== undefined && input.studyYear !== null && input.studyYear !== '') {
    studyYear = typeof input.studyYear === 'string' && /^\d{1,2}$/.test(input.studyYear) ? Number(input.studyYear) : typeof input.studyYear === 'number' ? input.studyYear : NaN
    if (!STUDY_YEARS[userType].includes(studyYear)) return null
  }
  return { phone, institution, studyUnit, studyYear, city }
}

/**
 * What a stored user still has to fill in before buying a ticket, worded for
 * the reminder shown to them. Empty once `purchaseProfile` accepts the user.
 */
export function missingPurchaseDetails(value: unknown): string[] {
  if (!registrationProfile(value)) return ['numele și categoria']
  const { phone, institution } = value as Record<string, unknown>
  const missing: string[] = []
  if (normalizePhone(phone) === null) missing.push('numărul de telefon')
  if (!(typeof institution === 'string' && institution.trim().length >= 2)) missing.push('instituția la care studiezi')
  return missing
}

/** A stored user may buy a ticket once the base profile, phone and institution are in place. */
export function purchaseProfile(value: unknown): boolean {
  const base = registrationProfile(value)
  if (!base) return false
  const { phone, institution } = value as Record<string, unknown>
  return normalizePhone(phone) !== null && typeof institution === 'string' && institution.trim().length >= 2
}

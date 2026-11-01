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

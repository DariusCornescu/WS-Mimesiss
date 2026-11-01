import { describe, expect, it } from 'vitest'
import { isUserType, registrationProfile } from '@/lib/registration-profile'

const valid = { firstName: ' Ana ', lastName: ' Popescu ', userType: 'student' }

describe('isUserType', () => {
  it.each(['student', 'elev', 'rezident'])('accepts %s', value => {
    expect(isUserType(value)).toBe(true)
  })

  it.each(['admin', 'Student', '', null, undefined, 1, { $ne: '' }])('rejects %s', value => {
    expect(isUserType(value)).toBe(false)
  })
})

describe('registrationProfile', () => {
  it('returns only trimmed names and the category', () => {
    expect(registrationProfile({ ...valid, role: 'admin', clerkId: 'victim', email: 'x@example.com' })).toEqual({
      firstName: 'Ana',
      lastName: 'Popescu',
      userType: 'student',
    })
  })

  it('accepts names at the 100 character limit after trimming', () => {
    const name = 'a'.repeat(100)
    expect(registrationProfile({ ...valid, firstName: `  ${name}  ` })?.firstName).toBe(name)
  })

  it.each([
    ['null', null],
    ['string', 'Ana Popescu'],
    ['empty object', {}],
    ['blank first name', { ...valid, firstName: '   ' }],
    ['blank last name', { ...valid, lastName: '' }],
    ['first name over 100 characters', { ...valid, firstName: 'a'.repeat(101) }],
    ['last name over 100 characters', { ...valid, lastName: 'a'.repeat(101) }],
    ['numeric name', { ...valid, firstName: 42 }],
    ['array name', { ...valid, lastName: ['Popescu'] }],
    ['privileged category', { ...valid, userType: 'admin' }],
    ['operator object category', { ...valid, userType: { $ne: '' } }],
  ])('rejects %s', (_label, value) => {
    expect(registrationProfile(value)).toBeNull()
  })

  it('does not read profile fields from a JSON "__proto__" key', () => {
    const polluted = JSON.parse('{"__proto__":{"userType":"student","firstName":"A","lastName":"B"}}')
    expect(registrationProfile(polluted)).toBeNull()
  })
})

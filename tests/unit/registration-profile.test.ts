import { describe, expect, it } from 'vitest'
import { isUserType, missingPurchaseDetails, normalizePhone, profileDetails, purchaseProfile, registrationProfile, studyYears } from '@/lib/registration-profile'

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

describe('normalizePhone', () => {
  it.each([
    ['0722 123 456', '0722123456'],
    ['+40 (722) 123-456', '+40722123456'],
    ['0722.123.456', '0722123456'],
  ])('accepts %s', (typed, stored) => {
    expect(normalizePhone(typed)).toBe(stored)
  })

  it.each(['', '12345', '0722 123 45a', '++40722123456', '1'.repeat(16), null, 722123456, { $ne: '' }])('rejects %s', value => {
    expect(normalizePhone(value)).toBeNull()
  })
})

describe('profileDetails', () => {
  const details = { phone: '0722 123 456', institution: ' UMF „Carol Davila” ', studyUnit: ' Medicină ', studyYear: '4', city: ' București ' }

  it('returns normalised details and nothing else', () => {
    expect(profileDetails({ ...details, role: 'admin' }, 'student')).toEqual({
      phone: '0722123456', institution: 'UMF „Carol Davila”', studyUnit: 'Medicină', studyYear: 4, city: 'București',
    })
  })

  it('treats empty optional fields as cleared', () => {
    expect(profileDetails({ phone: '0722123456', institution: 'UMF', studyUnit: '  ', studyYear: '', city: null }, 'student')).toEqual({
      phone: '0722123456', institution: 'UMF', studyUnit: null, studyYear: null, city: null,
    })
  })

  it.each([
    ['missing phone', { ...details, phone: '' }],
    ['missing institution', { ...details, institution: ' ' }],
    ['one-letter institution', { ...details, institution: 'U' }],
    ['institution over 150 characters', { ...details, institution: 'a'.repeat(151) }],
    ['city over 100 characters', { ...details, city: 'a'.repeat(101) }],
    ['non-text study unit', { ...details, studyUnit: { $ne: '' } }],
    ['year outside the category', { ...details, studyYear: '9' }],
    ['malformed year', { ...details, studyYear: '4; drop' }],
  ])('rejects %s', (_label, value) => {
    expect(profileDetails(value, 'student')).toBeNull()
  })

  it('accepts a school class only for pupils', () => {
    expect(profileDetails({ ...details, studyYear: '11' }, 'elev')?.studyYear).toBe(11)
    expect(profileDetails({ ...details, studyYear: '11' }, 'rezident')).toBeNull()
    expect(studyYears('elev')).toEqual([9, 10, 11, 12])
  })
})

describe('purchaseProfile', () => {
  const stored = { firstName: 'Ana', lastName: 'Popescu', userType: 'student', phone: '0722123456', institution: 'UMF' }

  it('needs the base profile, a phone and an institution', () => {
    expect(purchaseProfile(stored)).toBe(true)
    expect(purchaseProfile({ ...stored, phone: undefined })).toBe(false)
    expect(purchaseProfile({ ...stored, institution: ' ' })).toBe(false)
    expect(purchaseProfile({ ...stored, firstName: '' })).toBe(false)
    expect(purchaseProfile(null)).toBe(false)
  })
})

describe('missingPurchaseDetails', () => {
  const stored = { firstName: 'Ana', lastName: 'Popescu', userType: 'student', phone: '0722123456', institution: 'UMF' }

  it('names exactly what stands between the user and a purchase', () => {
    expect(missingPurchaseDetails(stored)).toEqual([])
    expect(missingPurchaseDetails({ ...stored, phone: undefined })).toEqual(['numărul de telefon'])
    expect(missingPurchaseDetails({ ...stored, institution: ' ' })).toEqual(['instituția la care studiezi'])
    expect(missingPurchaseDetails({ ...stored, phone: '12', institution: undefined })).toEqual(['numărul de telefon', 'instituția la care studiezi'])
    expect(missingPurchaseDetails({ ...stored, firstName: '' })).toEqual(['numele și categoria'])
  })

  it('agrees with purchaseProfile', () => {
    for (const user of [stored, { ...stored, phone: '' }, { ...stored, institution: 'U' }, { ...stored, userType: 'admin' }, null]) {
      expect(missingPurchaseDetails(user).length === 0).toBe(purchaseProfile(user))
    }
  })
})

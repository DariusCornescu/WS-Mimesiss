import { describe, expect, it } from 'vitest'
import {
  attendancePatchInput,
  issuedTicketStatusInput,
  manualPaymentInput,
  objectId,
  parseWith,
  paymentIntentInput,
  registrationInput,
  ticketCreateInput,
  userRoleInput,
  workshopInput,
} from '@/lib/validation'

const ID = '0123456789abcdefABCDEF01'

describe('objectId', () => {
  it('accepts exactly 24 hex characters', () => {
    expect(objectId.safeParse(ID).success).toBe(true)
  })

  it.each([
    ['too short', ID.slice(1)],
    ['too long', `${ID}0`],
    ['non-hex', 'g'.repeat(24)],
    ['query operator object', { $ne: null }],
    ['number', 123],
  ])('rejects %s', (_label, value) => {
    expect(objectId.safeParse(value).success).toBe(false)
  })
})

describe('parseWith', () => {
  it('returns parsed data on success', () => {
    expect(parseWith(registrationInput, { workshopId: ID, action: 'register' })).toEqual({
      ok: true,
      data: { workshopId: ID, action: 'register' },
    })
  })

  it('returns only the first issue as a user-facing message', () => {
    expect(parseWith(registrationInput, { workshopId: 'x', action: 'delete' })).toEqual({
      ok: false,
      error: 'Identificator invalid',
    })
    expect(parseWith(registrationInput, { workshopId: ID, action: 'delete' })).toEqual({
      ok: false,
      error: 'Acțiune invalidă',
    })
  })
})

describe('paymentIntentInput', () => {
  it('coerces form quantities and defaults to one ticket', () => {
    expect(paymentIntentInput.parse({ ticketId: ID, quantity: '2' }).quantity).toBe(2)
    expect(paymentIntentInput.parse({ ticketId: ID }).quantity).toBe(1)
  })

  it.each([0, -1, 1.5, 51, 'abc'])('rejects quantity %s', quantity => {
    expect(paymentIntentInput.safeParse({ ticketId: ID, quantity }).success).toBe(false)
  })

  it('rejects operator injection in the ticket id', () => {
    expect(paymentIntentInput.safeParse({ ticketId: { $gt: '' }, quantity: 1 }).success).toBe(false)
  })
})

describe('manualPaymentInput', () => {
  it('drops fields outside the whitelist and applies defaults', () => {
    const parsed = manualPaymentInput.parse({ clerkId: ' user_1 ', ticketId: ID, amount: 2000, role: 'admin', fulfillmentComplete: true })
    expect(parsed).toEqual({ clerkId: 'user_1', ticketId: ID, amount: 2000, currency: 'RON', status: 'completed', quantity: 1 })
    expect(parsed).not.toHaveProperty('role')
    expect(parsed).not.toHaveProperty('fulfillmentComplete')
  })

  it.each([0, -100, 10.5])('rejects non-positive or fractional amount %s', amount => {
    expect(manualPaymentInput.safeParse({ clerkId: 'user_1', ticketId: ID, amount }).success).toBe(false)
  })
})

describe('ticketCreateInput', () => {
  const ticket = { title: ' Bal ', description: 'Bilet', price: 20, features: ['Acces'], type: 'bal' }

  it('trims text fields', () => {
    expect(ticketCreateInput.parse(ticket).title).toBe('Bal')
  })

  it('reports Romanian messages for invalid price and empty title', () => {
    expect(parseWith(ticketCreateInput, { ...ticket, price: -1 })).toEqual({ ok: false, error: 'Prețul nu poate fi negativ' })
    expect(parseWith(ticketCreateInput, { ...ticket, title: '   ' })).toEqual({ ok: false, error: 'Titlul este obligatoriu' })
  })

  it('rejects non-finite prices and unknown categories', () => {
    expect(ticketCreateInput.safeParse({ ...ticket, price: Number.POSITIVE_INFINITY }).success).toBe(false)
    expect(ticketCreateInput.safeParse({ ...ticket, category: 'vip' }).success).toBe(false)
  })
})

describe('role and status inputs', () => {
  it('only accepts known roles and user types', () => {
    expect(userRoleInput.safeParse({ userId: 'u', role: 'moderator', userType: '' }).success).toBe(true)
    expect(userRoleInput.safeParse({ userId: 'u', role: 'superadmin' }).success).toBe(false)
    expect(userRoleInput.safeParse({ userId: 'u', role: 'user', userType: 'profesor' }).success).toBe(false)
  })

  it('only accepts known issued-ticket statuses and boolean attendance', () => {
    expect(issuedTicketStatusInput.safeParse({ ticketId: ID, status: 'used' }).success).toBe(true)
    expect(issuedTicketStatusInput.safeParse({ ticketId: ID, status: 'refunded' }).success).toBe(false)
    expect(attendancePatchInput.safeParse({ registrationId: ID, confirmed: 'true' }).success).toBe(false)
  })

  it('falls back to a workshop type instead of failing on unknown values', () => {
    const parsed = workshopInput.parse({ title: 'Atelier', description: 'Descriere', maxParticipants: 10, wsType: 'altceva' })
    expect(parsed.wsType).toBe('workshop')
  })
})

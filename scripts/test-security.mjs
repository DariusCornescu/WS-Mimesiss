import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
import Stripe from 'stripe'
import { load } from './helpers/load-ts.mjs'
const response = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200, headers: options?.headers }) } }
const security = load('src/lib/request-security.ts', { mongoose, 'node:crypto': crypto, 'next/server': response, '@/lib/mongodb': { default: async () => {}, __esModule: true } })
const { purchasePolicy } = load('src/lib/payment-policy.ts', { '@/lib/request-security': security })
const settings = { paymentsEnabled: true, eventMode: 'ball', ballMaxTicketsPerUser: 2 }
const ticket = { enabled: true, category: 'ball', price: 15.25 }
function jsonRequest(body, headers = {}) { return new Request('https://asmm.ro/api/test', { method: 'POST', body, headers: { origin: 'https://asmm.ro', 'content-type': 'application/json', ...headers } }) }
test('same-origin writes reject missing, null and unrelated origins', () => {
  security.requireSameOrigin(jsonRequest('{}'))
  for (const origin of ['', 'null', 'https://evil.example']) assert.throws(() => security.requireSameOrigin(jsonRequest('{}', { origin })), e => e.status === 403)
})
test('bounded JSON rejects oversized bodies, wrong content type and malformed input', async () => {
  assert.equal((await security.readSmallJson(jsonRequest('{"a":1}'))).a, 1)
  await assert.rejects(security.readSmallJson(jsonRequest('x'.repeat(8193))), e => e.status === 413)
  await assert.rejects(security.readSmallJson(jsonRequest('{')), e => e.status === 400)
  await assert.rejects(security.readSmallJson(jsonRequest('{}', { 'content-type': 'text/plain' })), e => e.status === 415)
})
test('payment policy rejects stopped sales, unavailable products and wrong event', () => {
  assert.equal(purchasePolicy(ticket, 2, settings, 0), 3050)
  for (const [t, s] of [[{ ...ticket, enabled: false }, settings], [ticket, { ...settings, paymentsEnabled: false }], [ticket, { ...settings, eventMode: 'workshops' }]]) assert.throws(() => purchasePolicy(t, 1, s, 0), e => e.status === 403)
})
test('purchase limits, sale dates and invalid amounts are checked on server', () => {
  for (const quantity of [0, -1, 1.5, 51, NaN]) assert.throws(() => purchasePolicy(ticket, quantity, settings, 0))
  assert.throws(() => purchasePolicy(ticket, 2, settings, 1))
  assert.throws(() => purchasePolicy({ ...ticket, category: 'workshop' }, 2, { ...settings, eventMode: 'workshops' }, 0))
  assert.throws(() => purchasePolicy(ticket, 1, { ...settings, ballTicketAvailableFrom: '2030-01-01' }, 0, 0))
  assert.throws(() => purchasePolicy(ticket, 1, { ...settings, ballTicketAvailableTo: '2020-01-01' }, 0))
  for (const price of [-1, 0, NaN, Infinity, 1000000000]) assert.throws(() => purchasePolicy({ ...ticket, price }, 1, settings, 0))
})
test('payment endpoint blocks anonymous callers, cross-origin requests and forged input', async () => {
  let calls = 0
  let account = null
  const { POST } = load('src/app/api/payments/create-payment-intent/route.ts', {
    '@clerk/nextjs/server': { currentUser: async () => account }, 'next/server': response,
    '@/lib/request-security': { ...security, limitRequests: async () => {} },
    '@/lib/validation': load('src/lib/validation.ts', { zod: await import('zod') }),
    '@/lib/payment-attempts': { reservePayment: async () => { calls++; return {} }, intentForAttempt: async () => ({ status: 'requires_payment_method', client_secret: 'test' }) },
  })
  assert.equal((await POST(jsonRequest('{}'))).status, 401)
  account = { id: 'buyer' }
  assert.equal((await POST(jsonRequest('{}', { origin: 'https://other.example' }))).status, 403)
  assert.equal((await POST(jsonRequest('{"ticketId":{"$ne":null},"quantity":-5}'))).status, 400)
  assert.equal(calls, 0)
})
test('webhook verifies real Stripe signatures and refuses altered or wrong-environment events', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_localfixture'
  const stripe = new Stripe('sk_test_localfixture')
  const secret = 'whsec_localfixture'
  const calls = []
  const { POST } = load('src/app/api/payments/webhook/route.ts', {
    'next/server': response,
    '@/lib/stripe': { constructEvent: (body, sig) => stripe.webhooks.constructEvent(body, sig, secret) },
    '@/lib/payment-fulfillment': { fulfillPayment: async intent => { calls.push(intent.id) } },
  })
  function webhook(live = false, tamper = false) {
    const payload = JSON.stringify({ id: 'evt_fixture', type: 'payment_intent.succeeded', livemode: live, data: { object: { id: 'pi_fixture' } } })
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret })
    return new Request('https://asmm.ro/api/payments/webhook', { method: 'POST', headers: { 'stripe-signature': signature }, body: tamper ? payload + ' ' : payload })
  }
  assert.equal((await POST(new Request('https://asmm.ro/api/payments/webhook', { method: 'POST', body: '{}' }))).status, 400)
  assert.equal((await POST(webhook(false, true))).status, 400)
  assert.equal((await POST(webhook(true))).status, 400)
  assert.equal((await POST(webhook())).status, 200)
  assert.equal(calls.length, 1)
  for (const prefix of ['rk_test_', 'sk_live_', 'rk_live_']) {
    process.env.STRIPE_SECRET_KEY = prefix + 'localfixture'
    const live = prefix.includes('_live_')
    assert.equal((await POST(webhook(live))).status, 200)
    assert.equal((await POST(webhook(!live))).status, 400)
  }
  process.env.STRIPE_SECRET_KEY = ''
  assert.equal((await POST(webhook())).status, 400)
})
test('failed fulfillment asks Stripe to retry instead of acknowledging success', async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fixture'
  const { POST } = load('src/app/api/payments/webhook/route.ts', {
    'next/server': response, '@/lib/stripe': { constructEvent: () => ({ livemode: false, type: 'payment_intent.succeeded', data: { object: {} } }) },
    '@/lib/payment-fulfillment': { fulfillPayment: async () => { throw Error('DB offline') } },
  })
  assert.equal((await POST(new Request('https://asmm.ro/api/payments/webhook', { method: 'POST', headers: { 'stripe-signature': 'fixture' }, body: '{}' }))).status, 500)
})
test('participant A cannot retrieve participant B profile', async () => {
  let dbCalls = 0
  const { GET } = load('src/app/api/users/[clerkId]/route.ts', {
    'next/server': response, '@clerk/nextjs/server': { currentUser: async () => ({ id: 'A' }) },
    '@/lib/mongodb': { default: async () => { dbCalls++ }, __esModule: true }, '@/models': {},
  })
  assert.equal((await GET(null, { params: Promise.resolve({ clerkId: 'B' }) })).status, 403)
  assert.equal(dbCalls, 0)
})

test('CSV exports cannot turn participant names into spreadsheet formulas', () => {
  const { escapeCsvCell } = load('src/lib/csv.ts')
  for (const name of ['=1+1', '+SUM(1,2)', '@SUM(A1)', '-1+2', '  =1+1']) assert.ok(escapeCsvCell(name).startsWith('"' + "'"))
  assert.equal(escapeCsvCell('Ana "Test"'), '"Ana ""Test"""')
})

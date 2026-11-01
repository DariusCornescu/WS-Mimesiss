import assert from 'node:assert/strict'
import test, { before, after, beforeEach } from 'node:test'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
import { MongoMemoryReplSet } from 'mongodb-memory-server-core'
import { load } from './helpers/load-ts.mjs'

let database, models, attempts, security, fulfillment, purchase, settings
const intents = new Map()
const keys = new Map()
let stripeCreates = 0
const stripe = { paymentIntents: {
  create: async (params, options) => {
    if (keys.has(options.idempotencyKey)) return keys.get(options.idempotencyKey)
    const intent = { ...params, id: 'pi_' + (++stripeCreates), client_secret: 'test_secret', status: 'requires_payment_method', amount_received: 0 }
    keys.set(options.idempotencyKey, intent); intents.set(intent.id, intent); return intent
  },
  retrieve: async id => intents.get(id),
  cancel: async id => { const intent = intents.get(id); intent.status = 'canceled'; return intent },
} }
const connection = { default: async () => mongoose, __esModule: true }
const response = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } }
before(async () => {
  // Never consumes MONGODB_URI: the test owns its temporary replica set.
  database = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1, storageEngine: 'wiredTiger', ip: '127.0.0.1' } })
  await mongoose.connect(database.getUri(), { dbName: 'asmm_security_test' })
  const appSettings = load('src/models/AppSettings.ts', { mongoose })
  models = load('src/models/index.ts', { mongoose, './AppSettings': appSettings })
  attempts = load('src/models/PaymentAttempt.ts', { mongoose })
  security = load('src/lib/request-security.ts', { mongoose, 'node:crypto': crypto, 'next/server': response, '@/lib/mongodb': connection })
  const policy = load('src/lib/payment-policy.ts', { '@/lib/request-security': security })
  purchase = load('src/lib/payment-attempts.ts', {
    mongoose, '@/lib/mongodb': connection, '@/models': models, '@/models/PaymentAttempt': attempts,
    '@/lib/stripe': { stripe }, '@/lib/settings': { getUncachedAppSettings: async () => settings },
    '@/lib/registration-profile': load('src/lib/registration-profile.ts'), '@/lib/payment-policy': policy, '@/lib/request-security': security,
  })
  fulfillment = load('src/lib/payment-fulfillment.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models, '@/models/PaymentAttempt': attempts })
  await Promise.all(Object.values(mongoose.models).map(model => model.init()))
}, { timeout: 240000 })
after(async () => { await mongoose.disconnect(); await database?.stop() })
beforeEach(async () => {
  for (const model of Object.values(mongoose.models)) await model.deleteMany({})
  settings = { paymentsEnabled: true, eventMode: 'ball', ballMaxTicketsPerUser: 2 }
  intents.clear(); keys.clear(); stripeCreates = 0
  await models.User.create({ clerkId: 'buyer', email: 'buyer@example.com', firstName: 'Ana', lastName: 'Popescu', userType: 'student', role: 'user' })
})
async function product(overrides = {}) {
  return models.Ticket.create({ title: 'Bal', description: 'Bilet de test', type: 'bal', price: 20, category: 'ball', enabled: true, features: [], ...overrides })
}
async function paid(quantity = 2) {
  const ticket = await product()
  const attempt = await purchase.reservePayment('buyer', String(ticket._id), quantity)
  const intent = await purchase.intentForAttempt(attempt)
  intent.status = 'succeeded'; intent.amount_received = intent.amount
  return { ticket, attempt, intent }
}
test('20 concurrent requests reserve only one purchase and one Stripe intent', async () => {
  const ticket = await product()
  const reservations = await Promise.all(Array.from({ length: 20 }, () => purchase.reservePayment('buyer', String(ticket._id), 2)))
  assert.equal(new Set(reservations.map(a => String(a._id))).size, 1)
  const results = await Promise.all(reservations.map(purchase.intentForAttempt))
  assert.equal(new Set(results.map(i => i.id)).size, 1)
  assert.equal(stripeCreates, 1)
  assert.equal(await attempts.PaymentAttempt.countDocuments(), 1)
})
test('different products cannot bypass per-user pending reservation', async () => {
  const first = await product(); const second = await product({ type: 'bal2' })
  const results = await Promise.allSettled([purchase.reservePayment('buyer', String(first._id), 2), purchase.reservePayment('buyer', String(second._id), 2)])
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1)
  assert.equal(results.find(r => r.status === 'rejected').reason.code, 'payment_pending')
})
test('20 replayed webhook events issue exactly the purchased quantity', async () => {
  const { intent } = await paid()
  await Promise.all(Array.from({ length: 20 }, () => fulfillment.fulfillPayment(intent)))
  assert.equal(await models.Payment.countDocuments(), 1)
  assert.equal(await models.IssuedTicket.countDocuments(), 2)
  assert.equal((await attempts.PaymentAttempt.findOne()).status, 'completed')
  assert.equal((await models.Counter.findById('issuedTicket')).seq, 2)
})
test('transaction rolls back a failure during ticket issuance and a retry recovers', async () => {
  const { intent } = await paid()
  const original = models.IssuedTicket.create
  let writes = 0
  models.IssuedTicket.create = function (...args) { if (++writes === 2) throw Error('simulated interruption'); return original.apply(this, args) }
  try { await assert.rejects(fulfillment.fulfillPayment(intent), /simulated interruption/) }
  finally { models.IssuedTicket.create = original }
  assert.equal(await models.Payment.countDocuments(), 0)
  assert.equal(await models.IssuedTicket.countDocuments(), 0)
  assert.equal((await attempts.PaymentAttempt.findOne()).status, 'pending')
  assert.equal(await models.Counter.countDocuments(), 0)
  await fulfillment.fulfillPayment(intent)
  assert.equal(await models.IssuedTicket.countDocuments(), 2)
  assert.equal((await models.Counter.findById('issuedTicket')).seq, 2)
})
test('completed purchases count towards cap across different ball products', async () => {
  const { intent } = await paid(); await fulfillment.fulfillPayment(intent)
  const another = await product({ type: 'other' })
  await assert.rejects(purchase.reservePayment('buyer', String(another._id), 1), e => e.status === 409)
})
test('forged reservation metadata cannot issue tickets', async () => {
  const { intent } = await paid()
  await assert.rejects(fulfillment.fulfillPayment({ ...intent, amount: intent.amount + 1, amount_received: intent.amount + 1 }))
  await assert.rejects(fulfillment.fulfillPayment({ ...intent, metadata: { ...intent.metadata, quantity: '3' } }))
  assert.equal(await models.Payment.countDocuments(), 0)
  assert.equal(await models.IssuedTicket.countDocuments(), 0)
})
test('cancellation is owner-scoped and releases reservation only after Stripe cancellation', async () => {
  const ticket = await product()
  const attempt = await purchase.reservePayment('buyer', String(ticket._id), 2)
  const intent = await purchase.intentForAttempt(attempt)
  await purchase.cancelPendingPayment('other')
  assert.equal(intent.status, 'requires_payment_method')
  await purchase.cancelPendingPayment('buyer')
  assert.equal(intent.status, 'canceled')
  assert.equal((await attempts.PaymentAttempt.findById(attempt._id)).status, 'cancelled')
  const replacement = await purchase.reservePayment('buyer', String(ticket._id), 1)
  assert.notEqual(String(replacement._id), String(attempt._id))
})
test('successful or processing payments cannot release a purchase slot early', async () => {
  const { intent } = await paid()
  await assert.rejects(purchase.cancelPendingPayment('buyer'), e => e.status === 409)
  intent.status = 'processing'
  await assert.rejects(purchase.cancelPendingPayment('buyer'), e => e.status === 409)
  assert.equal((await attempts.PaymentAttempt.findOne()).status, 'pending')
})
test('unknown old Stripe creation is not retried after the idempotency window', async () => {
  const ticket = await product()
  const attempt = await purchase.reservePayment('buyer', String(ticket._id), 1)
  attempt.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000)
  await assert.rejects(purchase.intentForAttempt(attempt), e => e.code === 'payment_review')
  assert.equal(stripeCreates, 0)
})
test('distributed rate limit accepts only configured request count under concurrency', async () => {
  const results = await Promise.allSettled(Array.from({ length: 25 }, () => security.limitRequests('buyer', 'fixture', 10)))
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 10)
  assert.equal(results.filter(r => r.status === 'rejected' && r.reason.status === 429).length, 15)
})
test('simultaneous QR confirmations can consume an active ticket only once', async () => {
  const { intent } = await paid(1); await fulfillment.fulfillPayment(intent)
  const ticket = await models.IssuedTicket.findOne()
  const validation = load('src/lib/validation.ts', { zod: await import('zod') })
  const { PATCH } = load('src/app/api/admin/tickets/status/route.ts', {
    'next/server': response, '@/models': models, '@/lib/validation': validation,
    '@/lib/auth': { requireRole: async () => ({ role: 'moderator' }), toAuthResponse: () => null },
  })
  const responses = await Promise.all(Array.from({ length: 10 }, () => PATCH({ json: async () => ({ ticketId: String(ticket._id), status: 'used' }) })))
  assert.equal(responses.filter(r => r.status === 200).length, 1)
  assert.equal(responses.filter(r => r.status === 409).length, 9)
  assert.equal((await PATCH({ json: async () => ({ ticketId: String(ticket._id), status: 'active' }) })).status, 403)
})

test('parallel registrations cannot exceed two workshops per participant', async () => {
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshops = await models.Workshop.create(Array.from({ length: 6 }, (_, i) => ({ title: 'Atelier ' + i, description: 'Test', wsType: 'workshop', maxParticipants: 20 })))
  const results = await Promise.all(workshops.map(w => registration.registerUserForWorkshop({ userId: 'buyer', workshopId: String(w._id) })))
  assert.equal(results.filter(r => r.ok).length, 2)
  assert.equal(await models.Registration.countDocuments({ userId: 'buyer' }), 2)
  const counts = await models.Workshop.find().lean()
  assert.equal(counts.reduce((sum, w) => sum + w.currentParticipants, 0), 2)
})
test('workshop registration failure rolls back the reserved seat', async () => {
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshop = await models.Workshop.create({ title: 'Atelier', description: 'Test', wsType: 'workshop', maxParticipants: 1 })
  const original = models.Registration.create
  models.Registration.create = async () => { throw Error('simulated interruption') }
  try { assert.equal((await registration.registerUserForWorkshop({ userId: 'buyer', workshopId: String(workshop._id) })).ok, false) }
  finally { models.Registration.create = original }
  assert.equal((await models.Workshop.findById(workshop._id)).currentParticipants, 0)
  assert.equal(await models.Registration.countDocuments(), 0)
})

test('direct workshop registration cannot bypass the opening date', async () => {
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshop = await models.Workshop.create({ title: 'Atelier', description: 'Test', wsType: 'workshop', maxParticipants: 1 })
  const result = await registration.registerUserForWorkshop({ userId: 'buyer', workshopId: String(workshop._id), registrationStartTime: new Date(Date.now() + 60000) })
  assert.equal(result.code, 'not_open')
  assert.equal(await models.Registration.countDocuments(), 0)
})

test('historical partial issuance allocates only missing numbers', async () => {
  const { ticket, intent } = await paid(2)
  const payment = await models.Payment.create({ clerkId: 'buyer', stripeSessionId: intent.id, amount: intent.amount, quantity: 2, status: 'completed', ticketId: String(ticket._id), ticketType: ticket.type, ticketCategory: 'ball' })
  await models.Counter.create({ _id: 'issuedTicket', seq: 1 })
  await models.IssuedTicket.create({ ticketNumber: 1, clerkId: 'buyer', paymentId: String(payment._id), ticketTypeId: String(ticket._id), ticketTitle: ticket.title, ticketType: ticket.type, category: 'ball', pricePerTicket: 2000 })
  await fulfillment.fulfillPayment(intent)
  assert.deepEqual(await models.IssuedTicket.distinct('ticketNumber'), [1, 2])
  assert.equal((await models.Counter.findById('issuedTicket')).seq, 2)
  assert.equal((await models.Payment.findById(payment._id)).fulfillmentComplete, true)
})

test('replay after refund cannot consume numbers or issue tickets again', async () => {
  const { intent } = await paid(2)
  await fulfillment.fulfillPayment(intent)
  await models.Payment.updateOne({ stripeSessionId: intent.id }, { $set: { status: 'refunded' } })
  await fulfillment.fulfillPayment(intent)
  assert.equal((await models.Payment.findOne()).status, 'refunded')
  assert.equal((await models.Counter.findById('issuedTicket')).seq, 2)
  assert.equal(await models.IssuedTicket.countDocuments(), 2)
})

test('duplicate registration at full capacity keeps duplicate result and counter', async () => {
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshop = await models.Workshop.create({ title: 'Last place', description: 'Test', maxParticipants: 1 })
  const input = { userId: 'buyer', workshopId: String(workshop._id) }
  assert((await registration.registerUserForWorkshop(input)).ok)
  assert.equal((await registration.registerUserForWorkshop(input)).code, 'duplicate')
  assert.equal((await models.Workshop.findById(workshop._id)).currentParticipants, 1)
})

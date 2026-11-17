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
    '@/lib/ticket-stock': load('src/lib/ticket-stock.ts', { '@/models': models, '@/models/PaymentAttempt': attempts }),
    '@/lib/registration': load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models }),
  })
  fulfillment = load('src/lib/payment-fulfillment.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models, '@/models/PaymentAttempt': attempts })
  await Promise.all(Object.values(mongoose.models).map(model => model.init()))
}, { timeout: 240000 })
after(async () => { await mongoose.disconnect(); await database?.stop() })
beforeEach(async () => {
  for (const model of Object.values(mongoose.models)) await model.deleteMany({})
  settings = { paymentsEnabled: true, eventMode: 'ball', ballMaxTicketsPerUser: 2 }
  intents.clear(); keys.clear(); stripeCreates = 0
  await models.User.create({ clerkId: 'buyer', email: 'buyer@example.com', firstName: 'Ana', lastName: 'Popescu', userType: 'student', role: 'user', phone: '0722123456', institution: 'UMF' })
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
test('a checkout Stripe never created is cancelled without asking Stripe to create it', async () => {
  const ticket = await product()
  const attempt = await purchase.reservePayment('buyer', String(ticket._id), 1)
  await purchase.cancelPendingPayment('buyer')
  assert.equal(stripeCreates, 0)
  assert.equal((await attempts.PaymentAttempt.findById(attempt._id)).status, 'cancelled')
  await purchase.reservePayment('buyer', String(ticket._id), 2)
})
test('an intent created after its checkout was cancelled is closed at Stripe and never returned', async () => {
  const ticket = await product()
  const attempt = await purchase.reservePayment('buyer', String(ticket._id), 1)
  await purchase.cancelPendingPayment('buyer')
  await assert.rejects(purchase.intentForAttempt(attempt), e => e.code === 'payment_cancelled')
  assert.equal(stripeCreates, 1)
  assert.equal([...intents.values()][0].status, 'canceled')
})
test('a total under the 2 RON card minimum is refused before reaching Stripe', async () => {
  const ticket = await product({ price: 1 })
  await assert.rejects(purchase.reservePayment('buyer', String(ticket._id), 1), e => e.code === 'amount_too_small')
  assert.equal(await attempts.PaymentAttempt.countDocuments(), 0)
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

async function buyers(count) {
  await models.User.create(Array.from({ length: count }, (_, i) => ({ clerkId: 'buyer' + i, email: 'buyer' + i + '@example.com', firstName: 'Ana', lastName: 'Popescu', userType: 'student', role: 'user', phone: '0722123456', institution: 'UMF' })))
  return Array.from({ length: count }, (_, i) => 'buyer' + i)
}
test('concurrent buyers cannot reserve more than the ticket stock', async () => {
  settings = { paymentsEnabled: true, eventMode: 'workshops' }
  const ticket = await product({ category: 'workshop', type: 'activ', maxQuantity: 5 })
  const results = await Promise.allSettled((await buyers(30)).map(id => purchase.reservePayment(id, String(ticket._id), 1)))
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 5)
  assert.ok(results.filter(r => r.status === 'rejected').every(r => r.reason.code === 'sold_out'))
  assert.equal(await attempts.PaymentAttempt.countDocuments({ status: 'pending' }), 5)
})
test('paid tickets keep their stock and a cancelled checkout returns it', async () => {
  settings = { paymentsEnabled: true, eventMode: 'workshops' }
  const ticket = await product({ category: 'workshop', type: 'activ', maxQuantity: 2 })
  const [first, second, third] = await buyers(3)
  const attempt = await purchase.reservePayment(first, String(ticket._id), 1)
  const intent = await purchase.intentForAttempt(attempt)
  intent.status = 'succeeded'; intent.amount_received = intent.amount
  await fulfillment.fulfillPayment(intent)
  await purchase.intentForAttempt(await purchase.reservePayment(second, String(ticket._id), 1))
  await assert.rejects(purchase.reservePayment(third, String(ticket._id), 1), e => e.code === 'sold_out')
  await purchase.cancelPendingPayment(second)
  await purchase.reservePayment(third, String(ticket._id), 1)
  await assert.rejects(purchase.reservePayment(second, String(ticket._id), 1), e => e.code === 'sold_out')
})
test('an abandoned checkout is released for the next buyer, a recent or paid one is not', async () => {
  settings = { paymentsEnabled: true, eventMode: 'workshops' }
  const ticket = await product({ category: 'workshop', type: 'activ', maxQuantity: 1 })
  const [first, second, third] = await buyers(3)
  const attempt = await purchase.reservePayment(first, String(ticket._id), 1)
  const intent = await purchase.intentForAttempt(attempt)
  await assert.rejects(purchase.reservePayment(second, String(ticket._id), 1), e => e.code === 'sold_out')
  assert.equal(intent.status, 'requires_payment_method')
  const old = new Date(Date.now() - 31 * 60 * 1000)
  await attempts.PaymentAttempt.collection.updateOne({ _id: attempt._id }, { $set: { createdAt: old } })
  const replacement = await purchase.reservePayment(second, String(ticket._id), 1)
  assert.equal(intent.status, 'canceled')
  assert.equal((await attempts.PaymentAttempt.findById(attempt._id)).status, 'cancelled')
  // The replacement's payment is already going through: it must keep the unit.
  const paying = await purchase.intentForAttempt(replacement)
  paying.status = 'processing'
  await attempts.PaymentAttempt.collection.updateOne({ _id: replacement._id }, { $set: { createdAt: old } })
  await assert.rejects(purchase.reservePayment(third, String(ticket._id), 1), e => e.code === 'sold_out')
  assert.equal((await attempts.PaymentAttempt.findById(replacement._id)).status, 'pending')
})
test('a ticket without a stock limit is not capped', async () => {
  settings = { paymentsEnabled: true, eventMode: 'workshops' }
  const ticket = await product({ category: 'workshop', type: 'activ' })
  const results = await Promise.allSettled((await buyers(12)).map(id => purchase.reservePayment(id, String(ticket._id), 1)))
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 12)
})
test('congress tickets cannot be reserved before the sales start time', async () => {
  const ticket = await product({ category: 'workshop', type: 'activ' })
  settings = { paymentsEnabled: true, eventMode: 'workshops', ticketSalesStartTime: new Date(Date.now() + 60000).toISOString() }
  await assert.rejects(purchase.reservePayment('buyer', String(ticket._id), 1), e => e.status === 403)
  assert.equal(await attempts.PaymentAttempt.countDocuments(), 0)
  settings = { paymentsEnabled: true, eventMode: 'workshops', ticketSalesStartTime: new Date(Date.now() - 1000).toISOString() }
  await purchase.reservePayment('buyer', String(ticket._id), 1)
})

async function workshopSetup() {
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshop = await models.Workshop.create({ title: 'Atelier', description: 'Test', wsType: 'workshop', maxParticipants: 5 })
  const conference = await models.Workshop.create({ title: 'Conferință', description: 'Test', wsType: 'conferinta', maxParticipants: 5 })
  const register = (w, extra = {}) => registration.registerUserForWorkshop({ userId: 'buyer', workshopId: String(w._id), requireTicket: true, ...extra })
  return { workshop, conference, register }
}
async function payFor(ticket) {
  return models.Payment.create({ clerkId: 'buyer', stripeSessionId: 'pi_' + ticket._id, amount: 2000, quantity: 1, status: 'completed', ticketId: String(ticket._id), ticketType: ticket.type, ticketCategory: 'workshop' })
}
test('workshop registration needs a paid ticket with workshop access', async () => {
  const { workshop, conference, register } = await workshopSetup()
  assert.equal((await register(workshop)).code, 'ticket_required')
  assert.equal((await models.Workshop.findById(workshop._id)).currentParticipants, 0)
  // A ticket without workshop access is not enough.
  await payFor(await product({ category: 'workshop', type: 'pasiv' }))
  assert.equal((await register(workshop)).code, 'ticket_required')
  // Conferences and admin assignment stay open.
  assert.equal((await register(conference)).ok, true)
  assert.equal((await register(workshop, { adminOverride: true })).ok, true)
})
test('a paid ticket with workshop access opens registration; refund or cancellation closes it', async () => {
  const { workshop, register } = await workshopSetup()
  const ticket = await product({ category: 'workshop', type: 'activ', workshopAccess: true })
  // An unpaid checkout does not count.
  await models.Payment.create({ clerkId: 'buyer', stripeSessionId: 'pi_pending', amount: 2000, quantity: 1, status: 'pending', ticketId: String(ticket._id) })
  assert.equal((await register(workshop)).code, 'ticket_required')
  const payment = await payFor(ticket)
  assert.equal((await register(workshop)).ok, true)
  await models.Registration.deleteMany({})
  const issued = await models.IssuedTicket.create({ ticketNumber: 1, clerkId: 'buyer', paymentId: String(payment._id), ticketTypeId: String(ticket._id), ticketTitle: ticket.title, ticketType: ticket.type, category: 'workshop', pricePerTicket: 2000 })
  assert.equal((await register(workshop)).ok, true)
  await models.Registration.deleteMany({})
  await models.IssuedTicket.updateOne({ _id: issued._id }, { $set: { status: 'cancelled' } })
  assert.equal((await register(workshop)).code, 'ticket_required')
  await models.IssuedTicket.updateOne({ _id: issued._id }, { $set: { status: 'used' } })
  await models.Payment.updateOne({ _id: payment._id }, { $set: { status: 'refunded' } })
  assert.equal((await register(workshop)).code, 'ticket_required')
})
test("another participant's ticket does not open registration", async () => {
  const { workshop, register } = await workshopSetup()
  const ticket = await product({ category: 'workshop', type: 'activ', workshopAccess: true })
  await models.Payment.create({ clerkId: 'other', stripeSessionId: 'pi_other', amount: 2000, quantity: 1, status: 'completed', ticketId: String(ticket._id) })
  assert.equal((await register(workshop)).code, 'ticket_required')
})

test('a workshop add-on can be bought only while a workshop ticket stands', async () => {
  settings = { paymentsEnabled: true, eventMode: 'workshops' }
  const base = await product({ category: 'workshop', type: 'path', price: 50, workshopAccess: true })
  const addOn = await product({ category: 'workshop', type: 'path-extra', price: 20, extraWorkshops: 1 })
  await assert.rejects(purchase.reservePayment('buyer', String(addOn._id), 1), e => e.code === 'base_ticket_required')
  assert.equal(await attempts.PaymentAttempt.countDocuments(), 0)
  // Another participant's ticket does not unlock it.
  await models.Payment.create({ clerkId: 'other', stripeSessionId: 'pi_other', amount: 5000, quantity: 1, status: 'completed', ticketId: String(base._id) })
  await assert.rejects(purchase.reservePayment('buyer', String(addOn._id), 1), e => e.code === 'base_ticket_required')
  const payment = await payFor(base)
  const attempt = await purchase.reservePayment('buyer', String(addOn._id), 1)
  assert.equal(attempt.amount, 2000)
  await attempts.PaymentAttempt.deleteMany({})
  await models.Payment.updateOne({ _id: payment._id }, { $set: { status: 'refunded' } })
  await assert.rejects(purchase.reservePayment('buyer', String(addOn._id), 1), e => e.code === 'base_ticket_required')
})
test('a paid add-on raises the workshop limit from two to three while the base ticket stands', async () => {
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshops = await models.Workshop.create(Array.from({ length: 4 }, (_, i) => ({ title: 'Atelier ' + i, description: 'Test', wsType: 'workshop', maxParticipants: 20 })))
  const register = (w, extra = {}) => registration.registerUserForWorkshop({ userId: 'buyer', workshopId: String(w._id), requireTicket: true, ...extra })
  const base = await product({ category: 'workshop', type: 'path', price: 50, workshopAccess: true })
  const addOn = await product({ category: 'workshop', type: 'path-extra', price: 20, extraWorkshops: 1 })
  const basePayment = await payFor(base)
  assert.equal((await register(workshops[0])).ok, true)
  assert.equal((await register(workshops[1])).ok, true)
  const limited = await register(workshops[2])
  assert.equal(limited.code, 'user_limit')
  assert.match(limited.message, /maxim 2 .*suplimentar/)
  await payFor(addOn)
  assert.equal((await register(workshops[2])).ok, true)
  const full = await register(workshops[3])
  assert.equal(full.code, 'user_limit')
  assert.match(full.message, /maxim 3/)
  // Without a standing base ticket the add-on adds nothing, even for admins.
  await models.Registration.deleteMany({ workshopId: String(workshops[2]._id) })
  await models.Payment.updateOne({ _id: basePayment._id }, { $set: { status: 'refunded' } })
  assert.equal((await register(workshops[2], { adminOverride: true })).code, 'user_limit')
})

async function bundle() {
  settings = { paymentsEnabled: true, eventMode: 'workshops' }
  const base = await product({ category: 'workshop', type: 'path', price: 50, workshopAccess: true })
  const addOn = await product({ category: 'workshop', type: 'path-extra', price: 20, extraWorkshops: 1 })
  return { base, addOn }
}
test('a workshop ticket and its add-on are paid together and fulfilled as two purchases', async () => {
  const { base, addOn } = await bundle()
  const attempt = await purchase.reservePayment('buyer', String(base._id), 1, String(addOn._id))
  assert.equal(attempt.amount, 7000)
  assert.equal(attempt.addOnAmount, 2000)
  const intent = await purchase.intentForAttempt(attempt)
  assert.equal(intent.amount, 7000)
  assert.equal(intent.metadata.addOnTicketId, String(addOn._id))
  intent.status = 'succeeded'; intent.amount_received = intent.amount
  await Promise.all(Array.from({ length: 10 }, () => fulfillment.fulfillPayment(intent)))
  const payments = await models.Payment.find().sort({ amount: -1 }).lean()
  assert.deepEqual(payments.map(p => [p.ticketType, p.amount, p.stripePaymentIntentId]), [['path', 5000, intent.id], ['path-extra', 2000, intent.id]])
  // Only the ticket is an entry ticket; the add-on gets no number.
  const issued = await models.IssuedTicket.find().lean()
  assert.equal(issued.length, 1)
  assert.equal(issued[0].pricePerTicket, 5000)
  assert.equal((await attempts.PaymentAttempt.findById(attempt._id)).status, 'completed')
  // The add-on cannot be bought a second time on its own.
  await assert.rejects(purchase.reservePayment('buyer', String(addOn._id), 1), e => e.status === 409)
  // Three workshops are now open to the buyer.
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const workshops = await models.Workshop.create(Array.from({ length: 4 }, (_, i) => ({ title: 'Atelier ' + i, description: 'Test', wsType: 'workshop', maxParticipants: 20 })))
  const results = []
  for (const w of workshops) results.push(await registration.registerUserForWorkshop({ userId: 'buyer', workshopId: String(w._id), requireTicket: true }))
  assert.deepEqual(results.map(r => r.ok), [true, true, true, false])
})
test('an add-on joins only a ticket with workshop access and a changed choice needs a new checkout', async () => {
  const { base, addOn } = await bundle()
  const plain = await product({ category: 'workshop', type: 'pasiv', price: 30 })
  await assert.rejects(purchase.reservePayment('buyer', String(plain._id), 1, String(addOn._id)), e => e.code === 'base_ticket_required')
  await assert.rejects(purchase.reservePayment('buyer', String(base._id), 1, String(plain._id)), e => e.status === 404)
  await assert.rejects(purchase.reservePayment('buyer', String(addOn._id), 1, String(addOn._id)), e => e.status === 400)
  assert.equal(await attempts.PaymentAttempt.countDocuments(), 0)
  const first = await purchase.reservePayment('buyer', String(base._id), 1, String(addOn._id))
  // The same choice resumes the open checkout; a different one does not replace it.
  assert.equal(String((await purchase.reservePayment('buyer', String(base._id), 1, String(addOn._id)))._id), String(first._id))
  await assert.rejects(purchase.reservePayment('buyer', String(base._id), 1), e => e.code === 'payment_pending')
})
test('an add-on held by an open checkout counts against its stock', async () => {
  const { base, addOn } = await bundle()
  await models.Ticket.updateOne({ _id: addOn._id }, { $set: { maxQuantity: 1 } })
  await purchase.reservePayment('buyer', String(base._id), 1, String(addOn._id))
  await models.User.create({ clerkId: 'second', email: 'second@example.com', firstName: 'Ion', lastName: 'Pop', userType: 'student', role: 'user', phone: '0722123457', institution: 'UMF' })
  await assert.rejects(purchase.reservePayment('second', String(base._id), 1, String(addOn._id)), e => e.code === 'sold_out')
  // The ticket alone is still for sale.
  await purchase.reservePayment('second', String(base._id), 1)
})
test('forged add-on metadata cannot create an add-on purchase', async () => {
  const { base, addOn } = await bundle()
  const attempt = await purchase.reservePayment('buyer', String(base._id), 1)
  const intent = await purchase.intentForAttempt(attempt)
  intent.status = 'succeeded'; intent.amount_received = intent.amount
  const forged = { ...intent, amount: 7000, amount_received: 7000, metadata: { ...intent.metadata, addOnTicketId: String(addOn._id), addOnTicketType: 'path-extra', addOnAmount: '2000' } }
  await assert.rejects(fulfillment.fulfillPayment(forged))
  assert.equal(await models.Payment.countDocuments(), 0)
})

test('a ticket cannot be reserved until the profile has a phone and an institution', async () => {
  const ticket = await product()
  await models.User.updateOne({ clerkId: 'buyer' }, { $unset: { phone: '' } })
  await assert.rejects(purchase.reservePayment('buyer', String(ticket._id), 1), e => e.code === 'profile_incomplete')
  await models.User.updateOne({ clerkId: 'buyer' }, { $set: { phone: '0722123456' }, $unset: { institution: '' } })
  await assert.rejects(purchase.reservePayment('buyer', String(ticket._id), 1), e => e.code === 'profile_incomplete')
  assert.equal(await attempts.PaymentAttempt.countDocuments(), 0)
  await models.User.updateOne({ clerkId: 'buyer' }, { $set: { institution: 'UMF' } })
  await purchase.reservePayment('buyer', String(ticket._id), 1)
})

/** Application/DB bursts only. Never reads .env or calls external providers. */
import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { AsyncLocalStorage } from 'node:async_hooks'
import os from 'node:os'
import mongoose from 'mongoose'
import { MongoMemoryReplSet } from 'mongodb-memory-server-core'
import { load } from './helpers/load-ts.mjs'

const levels = (process.env.STRESS_LEVELS || '100,250,400,500').split(',').map(Number)
assert(levels.length <= 4 && levels.every(n => Number.isInteger(n) && n >= 1 && n <= 1000), 'Use up to four levels between 1 and 1000')
const profile = process.env.STRESS_PROFILE || 'burst'
assert(['burst', 'arrivals'].includes(profile), 'Use burst or arrivals profile')
const arrivalSeconds = Number(process.env.STRESS_ARRIVAL_SECONDS || '300')
assert(Number.isInteger(arrivalSeconds) && arrivalSeconds >= 1 && arrivalSeconds <= 300, 'Arrival window must be between 1 and 300 seconds')
assert(profile !== 'arrivals' || levels.length === 1, 'Use one level per arrivals run')
const results = []
const report = {
  startedAt: new Date().toISOString(), scope: 'local application/DB bursts; NOT website capacity',
  node: process.version, platform: os.platform(), cpu: os.cpus()[0]?.model,
  poolSize: 10, mongoVersion: '7.0.24', levels, profile, arrivalSeconds: profile === 'arrivals' ? arrivalSeconds : null, results,
  excluded: ['HTTP/Next rendering', 'Clerk network/authentication', 'Stripe network/signatures', 'Atlas limits', 'Vercel scaling'],
  sourceHashes: {},
}
for (const file of ['scripts/stress-local.mjs', 'src/lib/registration.ts', 'src/lib/payment-attempts.ts', 'src/lib/payment-fulfillment.ts', 'src/app/congres/workshops/actions.ts', 'src/models/index.ts']) {
  report.sourceHashes[file] = createHash('sha256').update(await readFile(file)).digest('hex')
}
let db
const actors = new AsyncLocalStorage()
const connection = { default: async () => mongoose, __esModule: true }
const responses = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } }
const settings = { paymentsEnabled: true, eventMode: 'ball', ballMaxTicketsPerUser: 2, globalRegistrationEnabled: true, allowCancelRegistration: true }
const intents = new Map(), keys = new Map()
let stripeCreates = 0
let transactionStarts = 0, writeConflicts = 0
// Idempotent provider double. No payment is sent to Stripe.
const stripe = { paymentIntents: {
  create: async (params, options) => {
    if (keys.has(options.idempotencyKey)) return keys.get(options.idempotencyKey)
    const intent = { ...params, id: `pi_fixture_${++stripeCreates}`, status: 'succeeded', amount_received: params.amount }
    keys.set(options.idempotencyKey, intent); intents.set(intent.id, intent)
    return intent
  },
  retrieve: async id => intents.get(id),
} }

async function burst(name, count, operation, classify = () => 'ok', arrivalWindowMs = 0) {
  const initialStarts = transactionStarts, initialConflicts = writeConflicts
  const start = performance.now()
  let active = 0, peakActive = 0
  const arrivalDelays = []
  const samples = await Promise.all(Array.from({ length: count }, async (_, index) => {
    const due = start + index * arrivalWindowMs / count
    if (arrivalWindowMs) await new Promise(resolve => setTimeout(resolve, Math.max(0, due - performance.now())))
    const begin = performance.now()
    arrivalDelays.push(Math.max(0, begin - due))
    active++; peakActive = Math.max(peakActive, active)
    try {
      const value = await operation(index)
      return { ms: performance.now() - begin, outcome: classify(value), value }
    } catch {
      return { ms: performance.now() - begin, outcome: 'unexpected_error' }
    } finally {
      active--
    }
  }))
  const elapsedMs = performance.now() - start
  const times = samples.map(s => s.ms).sort((a, b) => a - b)
  const percentile = p => Math.round(times[Math.max(0, Math.ceil(count * p) - 1)])
  const outcomes = {}
  for (const sample of samples) outcomes[sample.outcome] = (outcomes[sample.outcome] || 0) + 1
  arrivalDelays.sort((a, b) => a - b)
  const row = { name, count, arrivalWindowMs, peakActive, arrivalDelayP95Ms: Math.round(arrivalDelays[Math.max(0, Math.ceil(count * .95) - 1)]), elapsedMs: Math.round(elapsedMs), operationsPerSecond: +(count * 1000 / elapsedMs).toFixed(1), p50Ms: percentile(.5), p95Ms: percentile(.95), p99Ms: percentile(.99), transactionStarts: transactionStarts - initialStarts, writeConflicts: writeConflicts - initialConflicts, outcomes }
  results.push(row)
  console.log(JSON.stringify(row))
  assert.equal(outcomes.unexpected_error || 0, 0, `${name}: unexpected failures`)
  assert.equal(outcomes.unknown || 0, 0, `${name}: transaction failures`)
  return samples.map(s => s.value)
}

// Only connect to a temporary replica set owned by this process.
const watchdog = setTimeout(() => {
  console.error('Stress run exceeded 15 minutes; stopping without a capacity verdict.')
  process.exit(1)
}, 15 * 60 * 1000)
try {
  db = await MongoMemoryReplSet.create({ binary: { version: '7.0.24' }, replSet: { count: 1, storageEngine: 'wiredTiger', ip: '127.0.0.1' } })
  await mongoose.connect(db.getUri(), { dbName: 'asmm_stress_ephemeral', maxPoolSize: 10, serverSelectionTimeoutMS: 5000, monitorCommands: true })
  mongoose.connection.getClient().on('commandStarted', event => { if (event.command.startTransaction) transactionStarts++ })
  mongoose.connection.getClient().on('commandFailed', event => { if (event.failure.code === 112) writeConflicts++ })
  const models = load('src/models/index.ts', { mongoose, './AppSettings': load('src/models/AppSettings.ts', { mongoose }) })
  const attempts = load('src/models/PaymentAttempt.ts', { mongoose })
  const security = load('src/lib/request-security.ts', { mongoose, 'node:crypto': { createHash }, 'next/server': responses, '@/lib/mongodb': connection })
  const registration = load('src/lib/registration.ts', { mongoose, '@/lib/mongodb': connection, '@/models': models })
  const purchase = load('src/lib/payment-attempts.ts', {
    mongoose, '@/models': models, '@/models/PaymentAttempt': attempts, '@/lib/mongodb': connection,
    '@/lib/stripe': { stripe }, '@/lib/settings': { getUncachedAppSettings: async () => settings },
    '@/lib/registration-profile': load('src/lib/registration-profile.ts'),
    '@/lib/payment-policy': load('src/lib/payment-policy.ts', { '@/lib/request-security': security }), '@/lib/request-security': security,
  })
  const fulfillment = load('src/lib/payment-fulfillment.ts', { mongoose, '@/models': models, '@/models/PaymentAttempt': attempts, '@/lib/mongodb': connection })
  const editionId = new mongoose.Types.ObjectId()
  const action = load('src/app/congres/workshops/actions.ts', {
    mongoose, '@/models': models, '@/lib/mongodb': connection, '@/lib/registration': registration,
    '@clerk/nextjs/server': { currentUser: async () => ({ id: actors.getStore() }) },
    '@/lib/auth': { syncUserWithDatabase: async () => {} },
    '@/lib/request-security': security, 'next/cache': { revalidatePath() {} },
    '@/lib/settings': { getUncachedAppSettings: async () => settings },
    '@/lib/editions': { getActiveEdition: async () => ({ _id: String(editionId) }) },
    '@/lib/validation': load('src/lib/validation.ts', { zod: await import('zod') }),
  })
  await Promise.all(Object.values(mongoose.models).map(model => model.init()))
  async function fixture(count, seats = 1, workshopCount = 1) {
    // All cleanup is confined to this process-owned ephemeral DB.
    for (const model of Object.values(mongoose.models)) await model.deleteMany({})
    keys.clear(); intents.clear(); stripeCreates = 0
    await models.User.insertMany(Array.from({ length: count }, (_, i) => ({ clerkId: `fixture-${i}`, email: `fixture-${i}@example.invalid`, firstName: 'Ana', lastName: 'Test', userType: 'student' })))
    return models.Workshop.create(Array.from({ length: workshopCount }, (_, i) => ({ title: `Test ${i}`, description: 'Synthetic fixture', maxParticipants: seats, editionId })))
  }
  const classify = result => result.ok ? 'ok' : result.code
  async function verifySeats() {
    for (const workshop of await models.Workshop.find().lean()) {
      const count = await models.Registration.countDocuments({ workshopId: String(workshop._id) })
      assert.equal(workshop.currentParticipants, count, 'seat counter drift')
      assert(count <= workshop.maxParticipants, 'oversold workshop')
    }
    const duplicates = await models.Registration.aggregate([{ $group: { _id: { user: '$userId', workshop: '$workshopId' }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }])
    assert.equal(duplicates.length, 0, 'duplicate registration')
  }

  for (const count of levels) {
    console.log(`Starting stage ${count}; synthetic local data only.`)
    if (profile === 'arrivals') {
      const workshops = await fixture(count, Math.ceil(count / 10), 10)
      const rows = await burst('arrivals-distributed-registration', count, i => registration.registerUserForWorkshop({ userId: `fixture-${i}`, workshopId: String(workshops[i % 10]._id), activeEditionId: String(editionId) }), classify, arrivalSeconds * 1000)
      assert.equal(rows.filter(r => r.ok).length, count)
      await verifySeats()
      continue
    }
    let workshops = await fixture(count)
    let rows = await burst('last-seat', count, i => registration.registerUserForWorkshop({ userId: `fixture-${i}`, workshopId: String(workshops[0]._id), activeEditionId: String(editionId) }), classify)
    assert.equal(rows.filter(r => r.ok).length, 1)
    assert.equal(rows.filter(r => r.code === 'full').length, count - 1)
    await verifySeats()

    workshops = await fixture(count, Math.ceil(count / 10), 10)
    rows = await burst('distributed-registration', count, i => registration.registerUserForWorkshop({ userId: `fixture-${i}`, workshopId: String(workshops[i % 10]._id), activeEditionId: String(editionId) }), classify)
    assert.equal(rows.filter(r => r.ok).length, count)
    await verifySeats()

    workshops = await fixture(count, count)
    rows = await burst('hot-workshop', count, i => registration.registerUserForWorkshop({ userId: `fixture-${i}`, workshopId: String(workshops[0]._id), activeEditionId: String(editionId) }), classify)
    assert.equal(rows.filter(r => r.ok).length, count)
    await verifySeats()

    await fixture(count)
    const ticket = await models.Ticket.create({ title: 'Synthetic ticket', description: 'Local only', type: 'stress', category: 'ball', price: 20, enabled: true, features: [] })
    const paid = await burst('reserve-and-intent-mocked', count, async i => purchase.intentForAttempt(await purchase.reservePayment(`fixture-${i}`, String(ticket._id), 2)))
    assert.equal(stripeCreates, count)
    await burst('fulfillment', count, i => fulfillment.fulfillPayment(paid[i]))
    await burst('webhook-replay', count, i => fulfillment.fulfillPayment(paid[i]))
    assert.equal(await models.Payment.countDocuments({ fulfillmentComplete: true }), count)
    assert.equal(await models.IssuedTicket.countDocuments(), count * 2)
    assert.equal(await attempts.PaymentAttempt.countDocuments({ status: 'completed' }), count)
    assert.equal((await models.IssuedTicket.distinct('ticketNumber')).length, count * 2)
    assert.equal((await models.Counter.findById('issuedTicket')).seq, count * 2)
    const ticketGroups = await models.IssuedTicket.aggregate([{ $group: { _id: '$paymentId', count: { $sum: 1 }, amount: { $sum: '$pricePerTicket' } } }])
    assert.equal(ticketGroups.length, count)
    assert(ticketGroups.every(group => group.count === 2 && group.amount === 4000), 'incorrect per-payment issuance')
  }
  let workshops = await fixture(1, 10)
  let rows = await burst('same-user-double-click', 20, () => registration.registerUserForWorkshop({ userId: 'fixture-0', workshopId: String(workshops[0]._id) }), classify)
  assert.equal(rows.filter(r => r.ok).length, 1)
  await verifySeats()
  workshops = await fixture(1, 10, 6)
  rows = await burst('same-user-limit', 6, i => registration.registerUserForWorkshop({ userId: 'fixture-0', workshopId: String(workshops[i]._id) }), classify)
  assert.equal(rows.filter(r => r.ok).length, 2)
  await verifySeats()

  workshops = await fixture(1, 1)
  const workshopId = String(workshops[0]._id)
  assert((await registration.registerUserForWorkshop({ userId: 'fixture-0', workshopId })).ok)
  rows = await burst('concurrent-cancellation-action', 10, () => actors.run('fixture-0', () => {
    const data = new FormData(); data.set('workshopId', workshopId); data.set('action', 'cancel')
    return action.registerForWorkshop(data)
  }), r => r.success ? 'ok' : r.error === 'Nu există o înscriere de anulat.' ? 'already_cancelled' : 'unexpected_error')
  assert.equal(rows.filter(r => r.success).length, 1)
  await verifySeats()
  assert.equal(await models.Registration.countDocuments(), 0)
  await burst('recovery', 1, () => registration.registerUserForWorkshop({ userId: 'fixture-0', workshopId }), classify)
  assert.equal(await models.Registration.countDocuments(), 1)
  await verifySeats()
  report.integrityPassed = true
  report.latencyTargetPassed = results.every(row => row.p95Ms < 5000)
  if (!report.latencyTargetPassed) console.warn('Integrity passed; at least one burst exceeds the provisional 5s p95 target.')
} catch (error) {
  report.integrityPassed = false
  report.failure = error.message
  process.exitCode = 1
  console.error('Stress test failed:', error.message)
} finally {
  await mongoose.disconnect()
  await db?.stop()
  clearTimeout(watchdog)
  report.finishedAt = new Date().toISOString()
  await mkdir('.stress-results', { recursive: true })
  const path = `.stress-results/local-${report.startedAt.replace(/[:.]/g, '-')}.json`
  await writeFile(path, JSON.stringify(report, null, 2) + '\n')
  console.log(`Report: ${path}`)
}

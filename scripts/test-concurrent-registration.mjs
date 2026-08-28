/**
 * Concurrency probe for the atomic seat reservation in src/lib/registration.ts.
 *
 * The attempt() below mirrors the reserve + compensated-create shape of
 * registerUserForWorkshop — a plain .mjs cannot import the TS module, so if
 * that algorithm changes, KEEP THIS FILE IN SYNC (the module carries the same
 * note).
 *
 * Usage (local Mongo, throwaway data, cleans up after itself):
 *   MONGODB_URI=mongodb://localhost:27017/mimesiss node scripts/test-concurrent-registration.mjs
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mimesiss'

const WorkshopSchema = new mongoose.Schema({
  title: String,
  description: String,
  maxParticipants: Number,
  currentParticipants: { type: Number, default: 0 },
  wsType: String,
  status: String,
}, { timestamps: true })

const RegistrationSchema = new mongoose.Schema({
  userId: String,
  workshopId: String,
}, { timestamps: true })
RegistrationSchema.index({ userId: 1, workshopId: 1 }, { unique: true })

const Workshop = mongoose.model('Workshop', WorkshopSchema)
const Registration = mongoose.model('Registration', RegistrationSchema)

// Mirrors registerUserForWorkshop: duplicate fast path, atomic reserve,
// create with compensating decrement.
async function attempt(userId, workshopId) {
  const existing = await Registration.exists({ userId, workshopId })
  if (existing) return 'duplicate'

  const reserved = await Workshop.findOneAndUpdate(
    {
      _id: workshopId,
      status: 'active',
      $expr: { $lt: ['$currentParticipants', '$maxParticipants'] },
    },
    { $inc: { currentParticipants: 1 } },
  )
  if (!reserved) return 'full'

  try {
    await Registration.create({ userId, workshopId })
  } catch (error) {
    await Workshop.updateOne({ _id: workshopId }, { $inc: { currentParticipants: -1 } })
    if (error && error.code === 11000) return 'duplicate'
    throw error
  }
  return 'ok'
}

function check(cond, msg) {
  if (cond) {
    console.log('PASS: ' + msg)
  } else {
    console.error('FAIL: ' + msg)
    process.exitCode = 1
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI)
  // Make sure the unique index exists before racing on it.
  await Registration.init()

  const wsA = await Workshop.create({
    title: 'CONCURRENCY-PROBE-A', description: 'probe',
    maxParticipants: 5, currentParticipants: 0, wsType: 'workshop', status: 'active',
  })
  const wsB = await Workshop.create({
    title: 'CONCURRENCY-PROBE-B', description: 'probe',
    maxParticipants: 5, currentParticipants: 0, wsType: 'workshop', status: 'active',
  })

  try {
    // 25 distinct users race for 5 seats.
    const distinct = await Promise.all(
      Array.from({ length: 25 }, (_, i) => attempt('probe-user-' + i, String(wsA._id)))
    )
    const okA = distinct.filter(r => r === 'ok').length
    const regsA = await Registration.countDocuments({ workshopId: String(wsA._id) })
    const counterA = (await Workshop.findById(wsA._id)).currentParticipants
    check(okA === 5, `distinct-user race admits exactly 5 (got ${okA})`)
    check(regsA === 5, `registration count is 5 (got ${regsA})`)
    check(counterA === 5, `currentParticipants is 5 (got ${counterA})`)

    // 10 parallel attempts by ONE user land exactly one registration —
    // this also exercises the compensating decrement via the unique index.
    const same = await Promise.all(
      Array.from({ length: 10 }, () => attempt('probe-same-user', String(wsB._id)))
    )
    const okB = same.filter(r => r === 'ok').length
    const regsB = await Registration.countDocuments({ workshopId: String(wsB._id) })
    const counterB = (await Workshop.findById(wsB._id)).currentParticipants
    check(okB === 1, `same-user race admits exactly 1 (got ${okB})`)
    check(regsB === 1, `same-user registration count is 1 (got ${regsB})`)
    check(counterB === 1, `same-user currentParticipants is 1 (got ${counterB})`)
  } finally {
    await Registration.deleteMany({ workshopId: { $in: [String(wsA._id), String(wsB._id)] } })
    await Workshop.deleteMany({ _id: { $in: [wsA._id, wsB._id] } })
    await mongoose.disconnect()
  }

  console.log(process.exitCode ? 'PROBE FAILED' : 'PROBE PASSED')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

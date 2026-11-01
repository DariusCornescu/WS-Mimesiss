import assert from 'node:assert/strict'
import test from 'node:test'
import { load } from './helpers/load-ts.mjs'
const validation = load('src/lib/registration-profile.ts')
const valid = { firstName: ' Ana ', lastName: ' Popescu ', userType: 'rezident' }
const user = { id: 'user_existing', primaryEmailAddress: { emailAddress: 'ana@example.com', verification: { status: 'verified' } } }
const response = { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } }

test('profile input normalizes names and drops arbitrary role/identity fields', () => {
  const profile = validation.registrationProfile({ ...valid, role: 'admin', clerkId: 'victim' })
  assert.equal(profile.firstName, 'Ana')
  assert.equal(profile.role, undefined)
  assert.equal(profile.clerkId, undefined)
  for (const userType of ['student', 'elev', 'rezident']) assert.ok(validation.registrationProfile({ ...valid, userType }))
  for (const data of [null, {}, { ...valid, firstName: ' ' }, { ...valid, lastName: 'x'.repeat(101) }, { ...valid, userType: 'admin' }, { ...valid, userType: { $ne: '' } }]) assert.equal(validation.registrationProfile(data), null)
})
function routeHarness({ account = user, fail = false } = {}) {
  const saves = []
  const { POST } = load('src/app/api/auth/complete-profile/route.ts', {
    '@clerk/nextjs/server': { currentUser: async () => account }, 'next/server': response,
    '@/lib/profile': { saveProfile: async (user, profile) => { if (fail) throw Error('DB offline'); saves.push({ user, profile }) } },
    '@/lib/registration-profile': validation,
    '@/lib/request-security': { limitRequests: async () => {}, readSmallJson: async r => r.json().catch(() => null), requestErrorResponse: () => null },
  })
  return { POST, saves }
}
function request(data = valid, origin = 'https://asmm.ro') {
  return new Request('https://asmm.ro/api/auth/complete-profile', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(data) })
}
test('cross-origin, anonymous and unverified profile writes fail', async () => {
  assert.equal((await routeHarness().POST(request(valid, 'https://other.example'))).status, 403)
  assert.equal((await routeHarness({ account: null }).POST(request())).status, 401)
  assert.equal((await routeHarness({ account: { id: user.id } }).POST(request())).status, 403)
})
test('invalid profile never reaches storage', async () => {
  const h = routeHarness()
  assert.equal((await h.POST(request({ ...valid, userType: 'admin' }))).status, 400)
  assert.equal(h.saves.length, 0)
})
test('only authenticated identity and parsed profile reach storage', async () => {
  const h = routeHarness()
  assert.equal((await h.POST(request({ ...valid, clerkId: 'victim', role: 'admin' }))).status, 200)
  assert.equal(h.saves[0].user.id, user.id)
  assert.equal(h.saves[0].profile.role, undefined)
})
test('profile storage failure returns failure', async () => {
  assert.equal((await routeHarness({ fail: true }).POST(request())).status, 500)
})
function authHarness(existing) {
  let written
  const auth = load('src/lib/auth.ts', {
    'next/server': response, 'next/navigation': { redirect: path => { throw Error('redirect:' + path) } },
    '@clerk/nextjs/server': {}, '@/lib/mongodb': { default: async () => {}, __esModule: true },
    '@/lib/registration-profile': validation,
    '@/models': { User: { findOne: () => ({ lean: async () => existing }), findOneAndUpdate: (filter, fields, options) => { written = { filter, fields, options }; return { lean: async () => ({ ...existing, ...fields }) } } } },
  })
  return { auth, written: () => written }
}
test('editing browser metadata cannot complete a missing database profile', async () => {
  for (const pending of [true, false, undefined]) {
    const h = authHarness(null)
    await assert.rejects(h.auth.syncUserWithDatabase({ ...user, unsafeMetadata: { registrationProfilePending: pending, userType: 'student' }, firstName: 'Ana', lastName: 'Popescu' }), /redirect:/)
    assert.equal(h.written(), undefined)
  }
})
test('sync neither rewrites permissions nor trusts category from Clerk', async () => {
  const h = authHarness({ ...valid, role: 'moderator', clerkId: user.id })
  const result = await h.auth.syncUserWithDatabase({ ...user, publicMetadata: { role: 'admin' }, unsafeMetadata: { userType: 'student', registrationProfilePending: true }, emailAddresses: [] })
  assert.equal(result.role, 'moderator')
  assert.equal(result.userType, 'rezident')
  assert.equal(h.written().fields.role, undefined)
  assert.equal(h.written().fields.userType, undefined)
  assert.equal(h.written().options.upsert, false)
})
test('profile persistence creates ordinary users and preserves existing roles', async () => {
  let write
  let clerkFields
  const profile = load('src/lib/profile.ts', {
    '@clerk/nextjs/server': { clerkClient: async () => ({ users: { updateUser: async (id, fields) => { clerkFields = { id, fields } } } }) },
    '@/lib/mongodb': { default: async () => {}, __esModule: true }, '@/lib/registration-profile': validation,
    '@/models': { User: { findOneAndUpdate: (filter, fields) => { write = { filter, fields }; return { lean: async () => ({}) } } } },
  })
  await profile.saveProfile(user, { ...valid, role: 'admin', clerkId: 'victim' })
  assert.equal(write.filter.clerkId, user.id)
  assert.equal(write.fields.$setOnInsert.role, 'user')
  assert.equal(write.fields.$set.role, undefined)
  assert.equal(clerkFields.fields.unsafeMetadata, undefined)
  await assert.rejects(profile.saveProfile({ ...user, primaryEmailAddress: null }, valid))
})

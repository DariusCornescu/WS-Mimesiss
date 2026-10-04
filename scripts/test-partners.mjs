import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import mongoose from 'mongoose'
import { z } from 'zod'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import { load } from './helpers/load-ts.mjs'

let database
let authorized = true
const invalidations = []
const db = { default: async () => {}, __esModule: true }
class RequestError extends Error { constructor(status, message) { super(message); this.status = status } }
const models = load('src/models/Partner.ts', { mongoose })
const images = load('src/models/ProjectImage.ts', { mongoose })
const partners = load('src/lib/partners.ts', { '@/lib/mongodb': db, '@/models/Partner': models })
const route = load('src/app/api/admin/partners/route.ts', {
  zod: { z }, 'next/cache': { revalidatePath: path => invalidations.push(path) },
  '@/lib/mongodb': db, '@/models/Partner': models, '@/models/ProjectImage': images,
  '@/lib/auth': {
    requireRole: async role => { assert.equal(role, 'admin'); if (!authorized) throw new RequestError(403, 'Acces refuzat'); return { clerkId: 'test-admin' } },
    toAuthResponse: () => null,
  },
  '@/lib/request-security': {
    RequestError, limitRequests: async () => {},
    requireSameOrigin: request => { if (request.headers.get('origin') !== new URL(request.url).origin) throw new RequestError(403, 'Origine invalidă') },
    readSmallJson: request => request.json(),
    requestErrorResponse: error => error instanceof RequestError ? Response.json({ error: error.message }, { status: error.status }) : null,
  },
})
const request = (body, method = 'POST', origin = 'https://asmm.ro') => new Request('https://asmm.ro/api/admin/partners', {
  method, headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
})

before(async () => {
  database = await MongoMemoryServer.create({ binary: { version: '7.0.24' }, instance: { ip: '127.0.0.1', dbName: 'partners_isolated_test' } })
  await mongoose.connect(database.getUri())
})
after(async () => { await mongoose.disconnect(); await database?.stop() })

test('partner lifecycle defaults to hidden, supports optional name, publish, reorder, hide and delete', async () => {
  assert.deepEqual(await partners.getPartners(true), [])
  const image = await images.ProjectImage.create({ data: Buffer.from('fixture'), contentType: 'image/webp', createdBy: 'test-admin' })
  const values = { logo: `/api/project-images/${image._id}`, category: 'institutional' }
  const response = await route.POST(request(values))
  assert.equal(response.status, 201)
  const { partner } = await response.json()
  assert.equal(partner.name, '')
  assert.equal(partner.visible, false)
  assert.equal((await partners.getPartners()).length, 1)
  assert.deepEqual(await partners.getPartners(true), [])
  assert.equal((await route.PATCH(request({ ...partner, visible: true, name: 'Instituție aprobată', order: 2 }, 'PATCH'))).status, 200)
  const sponsorResponse = await route.POST(request({ ...values, category: 'sponsor', visible: true, order: 1 }))
  const { partner: sponsor } = await sponsorResponse.json()
  assert.deepEqual((await partners.getPartners(true)).map(item => item.id), [sponsor.id, partner.id])
  assert.equal((await route.PATCH(request({ ...partner, visible: false }, 'PATCH'))).status, 200)
  assert.deepEqual((await partners.getPartners(true)).map(item => item.id), [sponsor.id])
  assert.equal((await route.DELETE(request({ id: sponsor.id }, 'DELETE'))).status, 200)
  assert.deepEqual(await partners.getPartners(true), [])
  assert.ok(await images.ProjectImage.exists({ _id: image._id }))
  assert.ok(invalidations.includes('/'))
  assert.ok(invalidations.includes('/admin/parteneri'))
})

test('writes enforce admin role, same origin and valid stored logo', async () => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    authorized = false
    assert.equal((await route[method](request({}, method))).status, 403)
    authorized = true
    assert.equal((await route[method](request({}, method, 'https://other.example'))).status, 403)
  }
  const values = { logo: '/api/project-images/000000000000000000000000', category: 'sponsor' }
  assert.equal((await route.POST(request(values))).status, 400)
  assert.equal((await route.POST(request({ ...values, logo: 'https://other.example/logo.svg' }))).status, 400)
  assert.equal((await route.POST(request({ ...values, name: 'a'.repeat(161) }))).status, 400)
  assert.equal((await route.POST(request({ ...values, order: -1 }))).status, 400)
  assert.equal((await route.PATCH(request(values, 'PATCH'))).status, 400)
  assert.equal((await route.DELETE(request({ id: 'invalid' }, 'DELETE'))).status, 400)
})

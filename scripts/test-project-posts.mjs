import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import mongoose from 'mongoose'
import * as crypto from 'node:crypto'
import { load } from './helpers/load-ts.mjs'

class AuthError extends Error { constructor(status) { super('Acces refuzat'); this.status = status } }
class RequestError extends Error { constructor(status, message) { super(message); this.status = status } }
const security = {
  RequestError,
  requireSameOrigin(request) { if (request.headers.get('origin') !== new URL(request.url).origin) throw new RequestError(403, 'Origin') },
  limitRequests: async () => {},
  requestErrorResponse: e => e instanceof RequestError ? Response.json({ error: e.message }, { status: e.status }) : null,
}
const auth = {
  AuthError,
  requireRole: async () => ({ clerkId: 'admin-fixture' }),
  toAuthResponse: e => e instanceof AuthError ? Response.json({ error: e.message }, { status: e.status }) : null,
}
const db = { default: async () => {}, __esModule: true }
const galleryTypes = load('src/lib/gallery-types.ts')
function uploadHandler(overrides = {}) {
  return load('src/app/api/admin/project-images/route.ts', {
    sharp, 'node:crypto': crypto, '@/lib/gallery-types': galleryTypes, '@/lib/auth': auth, '@/lib/mongodb': db, '@/lib/request-security': security,
    '@/models/ProjectImage': { ProjectImage: { create: async () => ({ _id: 'image-fixture' }) } }, ...overrides,
  }).POST
}
function request(body, type = 'image/png', origin = 'https://asmm.ro') {
  return new Request('https://asmm.ro/api/admin/project-images', { method: 'POST', headers: { origin, 'content-type': type }, body })
}

test('image writes require administrator role and same origin', async () => {
  const denied = uploadHandler({ '@/lib/auth': { ...auth, requireRole: async () => { throw new AuthError(403) } } })
  assert.equal((await denied(request('x'))).status, 403)
  assert.equal((await uploadHandler()(request('x', 'image/png', 'https://other.example'))).status, 403)
})

test('upload rejects oversized, forged and unsafe image formats', async () => {
  const post = uploadHandler()
  assert.equal((await post(request(Buffer.alloc(3 * 1024 * 1024 + 1)))).status, 413)
  assert.equal((await post(request('not an image'))).status, 400)
  assert.equal((await post(request('<svg/>', 'image/svg+xml'))).status, 415)
  assert.equal((await post(request('<svg/>', 'image/png'))).status, 400)
})

test('valid upload is resized, converted to WebP and stored with its author', async () => {
  let saved
  const post = uploadHandler({ '@/models/ProjectImage': { ProjectImage: { create: async data => { saved = data; return { _id: 'image-fixture' } } } } })
  const image = await sharp({ create: { width: 2000, height: 1200, channels: 3, background: 'white' } }).png().toBuffer()
  const response = await post(request(image))
  assert.equal(response.status, 201)
  assert.equal((await response.json()).url, '/api/project-images/image-fixture')
  const metadata = await sharp(saved.data).metadata()
  assert.equal(metadata.format, 'webp')
  assert.equal(metadata.width, 1800)
  assert.equal(saved.createdBy, 'admin-fixture')
})

function actions(model, paths = []) {
  return load('src/app/admin/proiecte/actions.ts', {
    'next/cache': { revalidatePath: path => paths.push(path) },
    'next/navigation': { redirect: path => { throw new Error('redirect:' + path) } },
    mongoose, '@/lib/auth': auth, '@/lib/mongodb': db, '@/models': { Project: model },
  })
}
function form(overrides = {}) {
  const result = new FormData()
  for (const [key, value] of Object.entries({ title: 'Școala de vară', summary: 'Introducere', kind: 'announcement', status: 'draft', ...overrides })) result.set(key, value)
  return result
}

test('publishing requires a cover and duplicate addresses are shown as recoverable errors', async () => {
  let writes = 0
  const api = actions({ findOne: async () => ({ slug: 'existing' }), create: async () => writes++ })
  assert.match((await api.createProject({}, form({ status: 'published' }))).error, /imagine/)
  assert.match((await api.createProject({}, form())).error, /deja folosită/)
  assert.equal(writes, 0)
})

test('drafts save without images, normalize Romanian slugs and preserve announcement type', async () => {
  let saved
  const api = actions({ findOne: async () => null, create: async data => { saved = data } })
  await assert.rejects(api.createProject({}, form()), /redirect:\/admin\/proiecte/)
  assert.equal(saved.slug, 'scoala-de-vara')
  assert.equal(saved.kind, 'announcement')
  assert.equal(saved.status, 'draft')
})

test('renaming an article invalidates both old and new public URLs', async () => {
  const paths = []
  const api = actions({ findById: () => ({ lean: async () => ({ slug: 'old', kind: 'standard' }) }), findOne: async () => null, findByIdAndUpdate: async () => ({}) }, paths)
  await assert.rejects(api.updateProject('507f1f77bcf86cd799439011', {}, form()), /redirect:/)
  assert.ok(paths.includes('/proiecte/old'))
  assert.ok(paths.includes('/proiecte/scoala-de-vara'))
})

test('public reads exclude drafts', async () => {
  let query
  const api = load('src/lib/projects.ts', { '@/lib/mongodb': db, '@/models': { Project: { findOne: filter => { query = filter; return { lean: async () => null } } } } })
  assert.equal(await api.getProjectBySlug('draft-fixture'), null)
  assert.equal(query.status, 'published')
})

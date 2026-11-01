import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import crypto from 'node:crypto'
import mongoose from 'mongoose'
import sharp from 'sharp'
import { MongoMemoryServer } from 'mongodb-memory-server-core'
import { load } from './helpers/load-ts.mjs'

let database
let authorized = true
const invalidations = []
const db = { default: async () => {}, __esModule: true }
const next = { NextResponse: { json: (body, options) => Response.json(body, options) } }
const security = load('src/lib/request-security.ts', {
  mongoose, 'node:crypto': crypto, 'next/server': next, '@/lib/mongodb': db,
})
class AuthError extends Error { constructor() { super('Acces refuzat'); this.status = 403 } }
const auth = {
  requireRole: async (...roles) => {
    assert.deepEqual(roles, ['admin'])
    if (!authorized) throw new AuthError()
    return { clerkId: 'isolated-gallery-admin' }
  },
  toAuthResponse: error => error instanceof AuthError ? Response.json({ error: error.message }, { status: 403 }) : null,
}
const types = load('src/lib/gallery-types.ts')
const models = load('src/models/GalleryAlbum.ts', { mongoose })
const images = load('src/models/ProjectImage.ts', { mongoose })
const gallery = load('src/lib/gallery.ts', {
  '@/lib/mongodb': db, '@/models/GalleryAlbum': models, '@/models/ProjectImage': images,
  '@/lib/gallery-types': types, '@/lib/request-security': security,
})
const dependencies = {
  'next/cache': { revalidatePath: path => invalidations.push(path) },
  '@/lib/auth': auth, '@/lib/gallery': gallery, '@/lib/request-security': security,
}
const list = load('src/app/api/admin/gallery/route.ts', dependencies)
const item = load('src/app/api/admin/gallery/[id]/route.ts', dependencies)
const library = load('src/app/api/admin/project-images/route.ts', {
  sharp, 'node:crypto': crypto, '@/lib/auth': auth, '@/lib/mongodb': db,
  '@/lib/request-security': security, '@/models/ProjectImage': images,
  '@/lib/gallery-types': types,
})
const context = id => ({ params: Promise.resolve({ id }) })
const request = (body, method = 'POST', origin = 'https://asmm.ro') => new Request('https://asmm.ro/api/admin/gallery', {
  method, headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body),
})
const photo = (number, hidden = false) => ({ url: `/old/${number}.jpeg`, alt: 'Descriere accesibilă', caption: 'Legendă', hidden })

before(async () => {
  database = await MongoMemoryServer.create({ binary: { version: '7.0.24' }, instance: { ip: '127.0.0.1', dbName: 'gallery_isolated_test' } })
  await mongoose.connect(database.getUri(), { dbName: 'gallery_isolated_test' })
  await Promise.all([models.GalleryAlbum.init(), images.ProjectImage.init()])
})
after(async () => { await mongoose.disconnect(); await database?.stop() })

test('legacy archive is preserved, imported once and draft visibility is respected', async () => {
  assert.equal((await gallery.getPublishedAlbum('archive')).photos.length, 12)
  const first = await gallery.getAdminAlbums()
  const second = await gallery.getAdminAlbums()
  assert.equal(first.length, 1)
  assert.equal(second.length, 1)
  assert.equal(await models.GalleryAlbum.countDocuments({ legacy: true }), 1)
  const album = first[0]
  const updated = await gallery.updateAlbum('archive', { ...album, status: 'draft' }, 'test-admin')
  assert.equal(updated.revision, album.revision + 1)
  assert.equal(await gallery.getPublishedAlbum('archive'), null)
  assert.equal((await gallery.getPublishedAlbums()).length, 0)
})

test('album lifecycle publishes only visible photos, detects stale edits and retains reusable media on removal', async () => {
  const createdResponse = await list.POST(request({ title: 'Ediție demonstrativă', description: 'Test', editionYear: 2026 }))
  assert.equal(createdResponse.status, 201)
  const { album } = await createdResponse.json()
  assert.equal(await gallery.getPublishedAlbum(album.id), null)
  const editable = { ...album, status: 'published', photos: [photo(2), photo(1, true)], coverImage: '/old/2.jpeg' }
  const saved = await item.PUT(request(editable, 'PUT'), context(album.id))
  assert.equal(saved.status, 200)
  const published = await gallery.getPublishedAlbum(album.id)
  assert.equal(published.photos.length, 1)
  assert.equal(published.photos[0].url, '/old/2.jpeg')
  assert.equal((await item.PUT(request(editable, 'PUT'), context(album.id))).status, 409)
  assert.ok(invalidations.includes(`/congres/gallery/${album.id}`))
  assert.equal((await item.DELETE(new Request('https://asmm.ro/api/admin/gallery', { method: 'DELETE', headers: { origin: 'https://asmm.ro' } }), context(album.id))).status, 200)
  assert.equal(await gallery.getPublishedAlbum(album.id), null)
  assert.equal(await gallery.getAdminAlbum(album.id), null)
  assert.equal(await models.GalleryAlbum.countDocuments({ _id: album.id, removed: true }), 1)
})

test('server refuses nonexistent media references, hidden covers, foreign writes and non-admin access', async () => {
  const album = await gallery.createAlbum({ title: 'Validare', description: '' }, 'test-admin')
  const base = { ...album, status: 'published', photos: [photo(1, true)], coverImage: '/old/1.jpeg' }
  assert.equal((await item.PUT(request(base, 'PUT'), context(album.id))).status, 400)
  const missing = '/api/project-images/507f1f77bcf86cd799439011'
  assert.equal((await item.PUT(request({ ...base, photos: [{ ...photo(1), url: missing }], coverImage: missing }, 'PUT'), context(album.id))).status, 400)
  assert.equal((await list.POST(request({ title: 'Refuzat' }, 'POST', 'https://other.example'))).status, 403)
  authorized = false
  try {
    assert.equal((await list.GET()).status, 403)
    assert.equal((await item.GET(null, context(album.id))).status, 403)
    assert.equal((await item.PUT(request(base, 'PUT'), context(album.id))).status, 403)
    assert.equal((await library.GET(new Request('https://asmm.ro/api/admin/project-images'))).status, 403)
  } finally { authorized = true }
})

test('upload deduplicates the same photograph and library returns only reusable metadata', async () => {
  const binary = await sharp({ create: { width: 100, height: 80, channels: 3, background: 'white' } }).png().toBuffer()
  const upload = () => new Request('https://asmm.ro/api/admin/project-images', {
    method: 'POST', headers: { origin: 'https://asmm.ro', 'content-type': 'image/png', 'x-file-name': encodeURIComponent('Fotografie test.png') }, body: binary,
  })
  const a = await library.POST(upload())
  const b = await library.POST(upload())
  assert.equal(a.status, 201)
  assert.ok([200, 201].includes(b.status))
  const first = await a.json()
  assert.equal((await b.json()).url, first.url)
  assert.equal(await images.ProjectImage.countDocuments(), 1)
  const result = await library.GET(new Request('https://asmm.ro/api/admin/project-images'))
  assert.equal(result.status, 200)
  const body = await result.json()
  assert.equal(body.photos.length, 13)
  assert.ok(body.photos.some(entry => entry.url === first.url))
  assert.ok(body.photos.every(entry => !('data' in entry) && !('createdBy' in entry)))
  const album = await gallery.createAlbum({ title: 'Reutilizare' }, 'test-admin')
  await gallery.updateAlbum(album.id, { ...album, status: 'published', coverImage: first.url, photos: [{ url: first.url, alt: 'Test', caption: '', hidden: false }] }, 'test-admin')
  await gallery.removeAlbum(album.id, 'test-admin')
  assert.equal(await images.ProjectImage.countDocuments(), 1)
})

test('library pagination has no repeated uploads and rejects invalid cursors', async () => {
  await images.ProjectImage.insertMany(Array.from({ length: 55 }, (_, index) => ({
    data: Buffer.from([1]), contentType: 'image/webp', createdBy: 'isolated-fixture', name: `Fixture ${index}`,
  })))
  const first = await (await library.GET(new Request('https://asmm.ro/api/admin/project-images'))).json()
  assert.equal(first.photos.length, 62)
  assert.ok(first.nextCursor)
  const next = await (await library.GET(new Request(`https://asmm.ro/api/admin/project-images?cursor=${first.nextCursor}`))).json()
  assert.equal(next.photos.length, 6)
  assert.equal(next.nextCursor, null)
  assert.equal(new Set([...first.photos, ...next.photos].map(entry => entry.url)).size, 68)
  assert.equal((await library.GET(new Request('https://asmm.ro/api/admin/project-images?cursor=invalid'))).status, 400)
})

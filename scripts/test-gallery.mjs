import assert from 'node:assert/strict'
import test from 'node:test'
import sharp from 'sharp'
import * as crypto from 'node:crypto'
import { load } from './helpers/load-ts.mjs'

class AuthError extends Error { constructor(status) { super('Acces refuzat'); this.status = status } }
class RequestError extends Error { constructor(status, message) { super(message); this.status = status } }
const auth = {
  requireRole: async () => ({ clerkId: 'admin-fixture' }),
  toAuthResponse: error => error instanceof AuthError ? Response.json({ error: error.message }, { status: error.status }) : null,
}
const security = {
  RequestError,
  requireSameOrigin(request) { if (request.headers.get('origin') !== new URL(request.url).origin) throw new RequestError(403, 'Origin') },
  limitRequests: async () => {},
  readSmallJson: async request => request.json(),
  requestErrorResponse: error => error instanceof RequestError ? Response.json({ error: error.message }, { status: error.status }) : null,
}
const db = { default: async () => {}, __esModule: true }
const types = load('src/lib/gallery-types.ts')
const albumId = '507f1f77bcf86cd799439011'
const imageId = '507f1f77bcf86cd799439012'
const photo = (url = '/old/1.jpeg', hidden = false) => ({ url, alt: 'Fotografie', caption: '', hidden })
const input = changes => ({ title: 'Ediția MIMESISS', description: '', editionYear: 2026, status: 'draft', coverImage: '', photos: [], revision: 0, ...changes })
const record = changes => ({ ...input(), _id: albumId, updatedAt: new Date('2026-01-01T00:00:00Z'), ...changes })
const query = value => ({ select() { return this }, sort() { return this }, limit() { return this }, lean: async () => value })
function library(album = {}, image = {}) {
  return load('src/lib/gallery.ts', {
    '@/lib/mongodb': db, '@/models/GalleryAlbum': { GalleryAlbum: album }, '@/models/ProjectImage': { ProjectImage: image },
    '@/lib/gallery-types': types, '@/lib/request-security': security,
  })
}
const validators = library()
const isBadInput = error => error instanceof RequestError && error.status === 400

test('new albums always start as drafts, with bounded and normalized metadata', () => {
  const data = validators.parseAlbumInput({ title: '  Album  ', editionYear: 2026, status: 'published', photos: [photo()], legacy: true }, true)
  assert.equal(data.title, 'Album')
  assert.equal(data.status, 'draft')
  assert.equal(data.photos.length, 0)
  assert.equal(data.coverImage, '')
  assert.equal('legacy' in data, false)
  assert.throws(() => validators.parseAlbumInput(input({ title: '   ' })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ title: 'x'.repeat(121) })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ description: 'x'.repeat(1001) })), isBadInput)
  for (const editionYear of [1899, 2101, 2026.5, '2026']) assert.throws(() => validators.parseAlbumInput(input({ editionYear })), isBadInput)
})

test('drafts can be empty; published albums require visible photos and a visible cover', () => {
  assert.equal(validators.parseAlbumInput(input()).photos.length, 0)
  assert.throws(() => validators.parseAlbumInput(input({ status: 'published' })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ status: 'published', coverImage: '/old/1.jpeg', photos: [photo('/old/1.jpeg', true)] })), isBadInput)
  const published = validators.parseAlbumInput(input({ status: 'published', coverImage: '/old/1.jpeg', photos: [photo()] }))
  assert.equal(published.status, 'published')
})

test('photo references are local, unique, bounded and cannot inject extra fields', () => {
  for (const url of ['https://example.com/photo.jpg', '//example.com/image', '/old/13.jpeg', '/old/../1.jpeg', '/api/project-images/not-an-id', 'javascript:alert(1)']) {
    assert.throws(() => validators.parseAlbumInput(input({ photos: [photo(url)] })), isBadInput)
  }
  assert.throws(() => validators.parseAlbumInput(input({ photos: [photo(), photo()] })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ photos: Array.from({ length: 201 }, () => photo()) })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ photos: [{ ...photo(), hidden: 'false' }] })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ photos: [{ ...photo(), alt: 'x'.repeat(241) }] })), isBadInput)
  assert.throws(() => validators.parseAlbumInput(input({ photos: [{ ...photo(), caption: 'x'.repeat(501) }] })), isBadInput)
  const sanitized = validators.parseAlbumInput(input({ photos: [{ ...photo(), data: 'private', createdBy: 'injected' }], removed: true, legacy: true }))
  assert.equal('data' in sanitized.photos[0], false)
  assert.equal('removed' in sanitized, false)
  assert.equal('legacy' in sanitized, false)
})

test('album ids and optimistic revisions reject malformed inputs', () => {
  assert.equal(validators.albumFilter('archive').legacy, true)
  assert.equal(validators.albumFilter(albumId)._id, albumId)
  for (const id of ['123', 'constructor', '$ne']) assert.throws(() => validators.albumFilter(id), isBadInput)
  for (const revision of [-1, 0.5, '0', undefined, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => validators.parseRevision({ revision }), isBadInput)
  assert.equal(validators.parseRevision({ revision: 5 }), 5)
})

test('missing library photos reject saves before writes, and checks fetch only ids', async () => {
  let selected, writes = 0
  const api = library({ findOneAndUpdate() { writes++; return query(null) } }, {
    find() { return { select(fields) { selected = fields; return query([]) } } },
  })
  await assert.rejects(api.updateAlbum(albumId, input({ photos: [photo(`/api/project-images/${imageId}`)] }), 'admin-fixture'), isBadInput)
  assert.equal(selected, '_id')
  assert.equal(writes, 0)
})

test('concurrent edits return 409 and deleted albums return 404', async () => {
  let filter, update
  const model = { findOneAndUpdate(queryFilter, changes) { filter = queryFilter; update = changes; return query(null) }, exists: async () => ({ _id: albumId }) }
  await assert.rejects(library(model).updateAlbum(albumId, input({ revision: 7 }), 'admin-fixture'), error => error.status === 409)
  assert.equal(filter.revision, 7)
  assert.equal(update.$inc.revision, 1)
  assert.equal('legacy' in update.$set, false)
  model.exists = async () => null
  await assert.rejects(library(model).updateAlbum(albumId, input(), 'admin-fixture'), error => error.status === 404)
})

test('public album data excludes hidden photos and internal fields', async () => {
  const api = library({ findOne: () => query(record({ status: 'published', coverImage: '/old/1.jpeg', photos: [photo(), photo('/old/2.jpeg', true)], createdBy: 'private' })) })
  const album = await api.getPublishedAlbum(albumId)
  assert.equal(album.photos.length, 1)
  assert.equal(album.photos[0].url, '/old/1.jpeg')
  assert.equal('createdBy' in album, false)
  assert.equal('_id' in album, false)
  assert.equal(await api.getPublishedAlbum('invalid'), null)
})

test('archive fallback appears only without a DB record; draft and removed archives stay hidden', async () => {
  const absent = library({ findOne: () => query(null), find: () => query([]), exists: async () => null })
  assert.equal((await absent.getPublishedAlbums())[0].id, 'archive')
  assert.equal((await absent.getPublishedAlbum('archive')).photos.length, 12)
  for (const state of [{ status: 'draft' }, { status: 'published', removed: true }]) {
    const api = library({ findOne: () => query(record({ legacy: true, ...state })), find: () => query([record({ legacy: true, ...state })]) })
    assert.equal(await api.getPublishedAlbum('archive'), null)
    assert.equal((await api.getPublishedAlbums()).length, 0)
  }
})

test('public list observes legacy import and visibility in one query', async () => {
  let reads = 0, filter
  const api = library({
    find(value) { reads++; filter = value; return query([record({ ...types.LEGACY_ALBUM, _id: albumId, updatedAt: new Date() })]) },
    exists() { throw new Error('A separate existence query could race with import') },
  })
  const albums = await api.getPublishedAlbums()
  assert.equal(reads, 1)
  assert.equal(filter.$or[1].legacy, true)
  assert.equal(albums.length, 1)
  assert.equal(albums[0].id, 'archive')
})

test('admin archive imports are insert-only, preserving edits and removal', async () => {
  let filter, update, options
  const api = library({
    updateOne: async (queryFilter, changes, settings) => { filter = queryFilter; update = changes; options = settings },
    find: () => query([]),
  })
  await api.getAdminAlbums()
  assert.equal(filter.legacy, true)
  assert.equal(update.$setOnInsert.photos.length, 12)
  assert.equal(Object.keys(update).length, 1)
  assert.equal(options.timestamps, false)
})

function routes(overrides = {}) {
  const paths = []
  const dependencies = {
    'next/cache': { revalidatePath: path => paths.push(path) }, '@/lib/auth': auth, '@/lib/request-security': security,
    '@/lib/gallery': { createAlbum: async () => ({ id: albumId }), getAdminAlbums: async () => [], getAdminAlbum: async () => ({ id: albumId }), updateAlbum: async () => ({ id: albumId }), removeAlbum: async () => {} },
    ...overrides,
  }
  return { ...load('src/app/api/admin/gallery/route.ts', dependencies), item: load('src/app/api/admin/gallery/[id]/route.ts', dependencies), paths }
}
const context = { params: Promise.resolve({ id: albumId }) }
function request(method = 'POST', origin = 'https://asmm.ro') { return new Request('https://asmm.ro/api/admin/gallery/' + albumId, { method, headers: { origin, 'content-type': 'application/json' }, body: method === 'DELETE' ? undefined : JSON.stringify(input()) }) }

test('all album operations require admin; writes reject another origin', async () => {
  const denied = routes({ '@/lib/auth': { ...auth, requireRole: async () => { throw new AuthError(403) } } })
  for (const response of [await denied.GET(), await denied.POST(request()), await denied.item.GET(new Request('https://asmm.ro'), context), await denied.item.PUT(request('PUT'), context), await denied.item.DELETE(request('DELETE'), context)]) assert.equal(response.status, 403)
  const allowed = routes()
  for (const response of [await allowed.POST(request('POST', 'https://other.example')), await allowed.item.PUT(request('PUT', 'https://other.example'), context), await allowed.item.DELETE(request('DELETE', 'https://other.example'), context)]) assert.equal(response.status, 403)
})

test('gallery writes pass bounded JSON through validation and invalidate public URLs', async () => {
  let limit, maximum
  const api = routes({ '@/lib/request-security': { ...security, limitRequests: async (...args) => { limit = args }, readSmallJson: async (_request, max) => { maximum = max; return input() } } })
  assert.equal((await api.POST(request())).status, 201)
  assert.equal(maximum, 200_000)
  assert.equal(limit[0], 'admin-fixture')
  assert.equal(limit[2], 60)
  assert.equal((await api.item.PUT(request('PUT'), context)).status, 200)
  assert.ok(api.paths.includes('/congres/gallery'))
  assert.ok(api.paths.includes('/congres/gallery/' + albumId))
  assert.ok(api.paths.includes('/congres/gallery/[id]'))
  assert.equal((await api.item.DELETE(request('DELETE'), context)).status, 200)
})

function imageRoutes(model, overrides = {}) {
  return load('src/app/api/admin/project-images/route.ts', {
    sharp, 'node:crypto': crypto, '@/lib/auth': auth, '@/lib/mongodb': db, '@/lib/request-security': security,
    '@/lib/gallery-types': types, '@/models/ProjectImage': { ProjectImage: model }, ...overrides,
  })
}

test('photo library is private, paginated and metadata only, with archive only on first page', async () => {
  let selected, limit, filter
  const records = Array.from({ length: 51 }, (_, index) => ({ _id: String(100 - index).padStart(24, '0'), name: 'Fotografie', createdAt: new Date(), data: 'private' }))
  const api = imageRoutes({ find(value) { filter = value; return { select(fields) { selected = fields; return this }, sort() { return this }, limit(max) { limit = max; return this }, lean: async () => records } } })
  const first = await api.GET(new Request('https://asmm.ro/api/admin/project-images'))
  const data = await first.json()
  assert.equal(first.headers.get('cache-control'), 'private, no-store')
  assert.equal(selected, '_id name createdAt')
  assert.equal(limit, 51)
  assert.equal(data.photos.length, 62)
  assert.equal('data' in data.photos[0], false)
  assert.equal(data.nextCursor, records[49]._id)
  const next = await (await api.GET(new Request('https://asmm.ro/api/admin/project-images?cursor=' + data.nextCursor))).json()
  assert.equal(next.photos.length, 50)
  assert.equal(filter._id.$lt, data.nextCursor)
  assert.equal((await api.GET(new Request('https://asmm.ro/api/admin/project-images?cursor=bad'))).status, 400)
})

test('photo library cannot be read without administrator access', async () => {
  const api = imageRoutes({}, { '@/lib/auth': { ...auth, requireRole: async () => { throw new AuthError(401) } } })
  assert.equal((await api.GET(new Request('https://asmm.ro/api/admin/project-images'))).status, 401)
})

test('duplicate uploads recover the existing id and sanitize encoded filenames', async () => {
  const image = await sharp({ create: { width: 24, height: 24, channels: 3, background: 'white' } }).png().toBuffer()
  let saved, selected, hash, limit
  const api = imageRoutes({
    create: async data => { saved = data; throw Object.assign(new Error('duplicate'), { code: 11000 }) },
    findOne: filter => { hash = filter.sha256; return { select(fields) { selected = fields; return query({ _id: imageId }) } } },
  }, { '@/lib/request-security': { ...security, limitRequests: async (...args) => { limit = args } } })
  const response = await api.POST(new Request('https://asmm.ro/api/admin/project-images', { method: 'POST', headers: { origin: 'https://asmm.ro', 'content-type': 'image/png', 'x-file-name': encodeURIComponent('../moment\nMIMESISS.png') }, body: image }))
  assert.equal(response.status, 201)
  assert.equal((await response.json()).url, '/api/project-images/' + imageId)
  assert.equal(saved.name, 'momentMIMESISS.png')
  assert.equal(hash, crypto.createHash('sha256').update(saved.data).digest('hex'))
  assert.equal(selected, '_id')
  assert.equal(limit[2], 120)
  assert.equal(limit[3], 600)
})

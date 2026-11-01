import assert from 'node:assert/strict'
import test from 'node:test'
import mongoose from 'mongoose'
import { load } from './helpers/load-ts.mjs'

class AuthError extends Error { constructor() { super('Acces refuzat') } }
const id = '507f1f77bcf86cd799439011'
const token = 'fde51f54-ac26-4cfe-b54d-301414b8694a'
const source = {
  slug: 'voluntariat', title: 'Voluntariat', kicker: 'Comunitate', summary: 'Introducere',
  description: 'Povestea proiectului', coverImage: '/old/3.jpeg', coverPositionX: 20,
  coverPositionY: 70, order: 3, status: 'published', kind: 'announcement',
}

function actions(model, authorize = async () => {}) {
  return load('src/app/admin/proiecte/actions.ts', {
    mongoose,
    'next/cache': { revalidatePath() {} },
    'next/navigation': { redirect: path => { throw new Error('redirect:' + path) } },
    '@/lib/auth': { AuthError, requireRole: authorize },
    '@/lib/mongodb': { default: async () => {}, __esModule: true },
    '@/models': { Project: model },
  })
}

function form(overrides = {}) {
  const data = new FormData()
  for (const [key, value] of Object.entries({ title: source.title, summary: source.summary, kind: 'standard', status: 'draft', ...overrides })) data.set(key, String(value))
  return data
}

test('duplicates keep the content and cover framing, select a unique address and open as a draft', async () => {
  let saved
  const api = actions({
    findById: () => ({ lean: async () => source }),
    findOne: async ({ slug }) => slug === 'voluntariat-copie' ? {} : null,
    create: async data => { saved = data; return { _id: id } },
  })
  await assert.rejects(api.duplicateProject(id), new RegExp(`redirect:/admin/proiecte/edit/${id}`))
  assert.equal(saved.slug, 'voluntariat-copie-2')
  assert.equal(saved.status, 'draft')
  for (const key of ['title', 'kicker', 'summary', 'description', 'coverImage', 'coverPositionX', 'coverPositionY', 'kind', 'order']) assert.equal(saved[key], source[key])
})

test('a conflicting concurrent copy retries safely without overwriting any post', async () => {
  let writes = 0
  const api = actions({
    findById: () => ({ lean: async () => source }), findOne: async () => null,
    create: async data => {
      writes++
      if (writes === 1) throw Object.assign(new Error('Duplicate key'), { code: 11000 })
      assert.equal(data.slug, 'voluntariat-copie-2')
      return { _id: id }
    },
  })
  await assert.rejects(api.duplicateProject(id), /redirect:/)
  assert.equal(writes, 2)
})

test('duplicate actions recheck the administrator role and reject protected congress records', async () => {
  let reads = 0
  const denied = actions({ findById: () => { reads++; throw new Error('Unexpected read') } }, async () => { throw new AuthError() })
  assert.match((await denied.duplicateProject(id)).error, /Acces refuzat/)
  assert.equal(reads, 0)
  const protectedPost = actions({ findById: () => ({ lean: async () => ({ ...source, kind: 'congress' }) }) })
  assert.match((await protectedPost.duplicateProject(id)).error, /protejat/)
})

test('cover framing validates boundaries server-side and old forms default to centered', async () => {
  let saved
  const api = actions({ findOne: async () => null, create: async data => { saved = data } })
  for (const value of [-1, 101, 'NaN']) assert.match((await api.createProject({}, form({ coverPositionX: value }))).error, /Încadrarea/)
  await assert.rejects(api.createProject({}, form()), /redirect:/)
  assert.equal(saved.coverPositionX, 50)
  assert.equal(saved.coverPositionY, 50)
  await assert.rejects(api.createProject({}, form({ coverPositionX: 0, coverPositionY: 100 })), /redirect:/)
  assert.equal(saved.coverPositionX, 0)
  assert.equal(saved.coverPositionY, 100)
})

test('only a successful write redirects with bounded local recovery identifiers', async () => {
  const api = actions({ findOne: async () => null, create: async () => ({}) })
  await assert.rejects(api.createProject({}, form({ recoveryKey: 'new', recoveryToken: token })), new RegExp(`redirect:/admin/proiecte\\?savedDraft=new&savedToken=${token}`))
  for (const invalid of [{ recoveryKey: '../other', recoveryToken: token }, { recoveryKey: 'new', recoveryToken: '-'.repeat(36) }]) {
    await assert.rejects(api.createProject({}, form(invalid)), error => error.message === 'redirect:/admin/proiecte')
  }
  const failed = await api.createProject({}, form({ title: '', recoveryKey: 'new', recoveryToken: token }))
  assert.match(failed.error, /Titlul/)
})

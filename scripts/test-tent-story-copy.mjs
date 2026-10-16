import assert from 'node:assert/strict'
import { test } from 'node:test'
import { load } from './helpers/load-ts.mjs'
const copyModule = load('src/lib/tent-story-copy.ts')
const { readTentCopy, storyCopyPassages, tentSceneKeys } = copyModule
const form = () => { const data = new FormData(); for (const key of tentSceneKeys) for (const field of ['title', 'body']) data.set(key + '.' + field, ''); return data }

test('editor preserves each scene and permits clearing text without changing its neighbours', () => {
  const data = form()
  data.set('imagistica.title', '  Titlu cu diacritice  ')
  data.set('prim-ajutor.body', 'Primul paragraf.\n\nAl doilea paragraf.')
  const copy = readTentCopy(data)
  assert.equal(copy.imagistica.title, 'Titlu cu diacritice')
  assert.equal(copy['prim-ajutor'].body, 'Primul paragraf.\n\nAl doilea paragraf.')
  assert.equal(copy.resuscitare.body, '')
  data.set('imagistica.title', '')
  assert.equal(readTentCopy(data).imagistica.title, '')
  assert.equal(readTentCopy(data)['prim-ajutor'].body, copy['prim-ajutor'].body)
})

test('editor rejects oversized, incomplete and duplicated fields', () => {
  const data = form(); data.set('imagistica.title', 'x'.repeat(81))
  assert.throws(() => readTentCopy(data), /80/)
  data.set('imagistica.title', ''); data.set('resuscitare.body', 'x'.repeat(1201))
  assert.throws(() => readTentCopy(data), /1200/)
  data.set('resuscitare.body', ''); data.delete('prim-ajutor.title')
  assert.throws(() => readTentCopy(data), /valid/)
  data.set('prim-ajutor.title', ''); data.append('imagistica.body', 'duplicat')
  assert.throws(() => readTentCopy(data), /valid/)
})

test('long copy remains complete while the first passage leaves room for its heading', () => {
  const body = 'Exersăm împreună tehnicile de prim ajutor, cu atenție și răbdare. '.repeat(18).trim()
  const passages = storyCopyPassages(body, true)
  assert.ok(passages.length > 2)
  assert.ok(passages[0].length <= 120)
  assert.ok(passages.every(p => p.length <= 220))
  assert.equal(passages.join(' '), body)
  assert.equal(storyCopyPassages('', false).length, 1)
})

class AuthError extends Error {}
function actionFor({ roleError, writeError } = {}) {
  const events = []
  const action = load('src/app/admin/proiecte/cortul-imm/actions.ts', {
    'next/cache': { updateTag: tag => events.push(['tag', tag]), revalidatePath: path => events.push(['path', path]) },
    '@/lib/auth': { AuthError, requireRole: async role => { events.push(['role', role]); if (roleError) throw new AuthError('Acces interzis'); return { clerkId: 'test-admin' } } },
    '@/lib/mongodb': async () => events.push(['db']),
    '@/models/ProjectStoryContent': { ProjectStoryContent: { findOneAndUpdate: async (...args) => { events.push(['write', ...args]); if (writeError) throw new Error('Database detail must stay private') } } },
    '@/lib/project-story-content': { tentStoryTag: 'tent-story-copy' },
    '@/lib/tent-story-copy': copyModule,
  }).saveTentStoryCopy
  return { action, events }
}

test('a rejected role cannot connect, write or invalidate cached public content', async () => {
  const { action, events } = actionFor({ roleError: true })
  const state = await action({ success: false }, form())
  assert.equal(state.success, false)
  assert.deepEqual(events, [['role', 'admin']])
})

test('saving writes all scene keys then expires the public cache; invalid input writes nothing', async () => {
  const { action, events } = actionFor()
  const data = form(); data.set('prim-ajutor.body', 'Text de verificare')
  assert.equal((await action({ success: false }, data)).success, true)
  const write = events.find(e => e[0] === 'write')
  assert.equal(write[1].slug, 'cortul-imm')
  assert.equal(write[2].$set.updatedBy, 'test-admin')
  assert.equal(write[2].$set.sections.find(s => s.key === 'prim-ajutor').body, 'Text de verificare')
  assert.equal(write[3].upsert, true)
  assert.equal(write[3].runValidators, true)
  assert.ok(events.findIndex(e => e[0] === 'tag') > events.findIndex(e => e[0] === 'write'))
  const invalid = actionFor(); data.set('imagistica.title', 'x'.repeat(81))
  assert.equal((await invalid.action({ success: false }, data)).success, false)
  assert.deepEqual(invalid.events, [['role', 'admin']])
})

test('failed storage surfaces an error without a success message or cache invalidation', async () => {
  const { action, events } = actionFor({ writeError: true })
  const result = await action({ success: false }, form())
  assert.equal(result.success, false)
  assert.ok(result.error.includes('nu au putut fi salvate'))
  assert.ok(!result.error.includes('Database detail'))
  assert.ok(!events.some(e => e[0] === 'tag' || e[0] === 'path'))
})

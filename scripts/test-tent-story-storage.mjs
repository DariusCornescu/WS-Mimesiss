import assert from 'node:assert/strict'
import { test } from 'node:test'
import mongoose from 'mongoose'
import { load } from './helpers/load-ts.mjs'
const uri = process.env.MONGODB_URI

test('tent text persists across updates and blank fields clear saved content', { skip: !uri }, async () => {
  const host = new URL(uri).hostname
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(host), 'Storage tests require a local database')
  const database = 'mimesiss_story_test_' + Date.now()
  await mongoose.connect(uri, { dbName: database })
  try {
    const copy = load('src/lib/tent-story-copy.ts')
    const { ProjectStoryContent } = load('src/models/ProjectStoryContent.ts', { mongoose, '@/lib/tent-story-copy': copy })
    const content = load('src/lib/project-story-content.ts', {
      'next/cache': { unstable_cache: fn => fn }, '@/lib/mongodb': async () => {},
      '@/models/ProjectStoryContent': { ProjectStoryContent }, '@/lib/tent-story-copy': copy,
    })
    const values = copy.emptyTentStoryCopy()
    values.imagistica = { title: 'Investigații', body: 'Text păstrat în baza de date.' }
    values['prim-ajutor'].body = 'Alt text'
    const invalidations = []
    const { saveTentStoryCopy } = load('src/app/admin/proiecte/cortul-imm/actions.ts', {
      'next/cache': { updateTag: tag => invalidations.push(tag), revalidatePath: () => {} },
      '@/lib/auth': { AuthError: class extends Error {}, requireRole: async () => ({ clerkId: 'local-test-admin' }) },
      '@/lib/mongodb': async () => {}, '@/models/ProjectStoryContent': { ProjectStoryContent },
      '@/lib/project-story-content': { tentStoryTag: 'tent-story-copy' }, '@/lib/tent-story-copy': copy,
    })
    const save = async () => {
      const form = new FormData()
      for (const key of copy.tentSceneKeys) for (const field of ['title', 'body']) form.set(key + '.' + field, values[key][field])
      const result = await saveTentStoryCopy({ success: false }, form)
      assert.equal(result.success, true)
    }
    await save()
    const restored = await content.readTentStoryCopy()
    assert.equal(restored.imagistica.title, 'Investigații')
    assert.equal(restored.imagistica.body, values.imagistica.body)
    values.imagistica = { title: '', body: '' }; await save()
    const cleared = await content.readTentStoryCopy()
    assert.equal(cleared.imagistica.body, '')
    assert.equal(cleared['prim-ajutor'].body, 'Alt text')
    assert.equal(await ProjectStoryContent.countDocuments({ slug: 'cortul-imm' }), 1)
    assert.deepEqual(invalidations, ['tent-story-copy', 'tent-story-copy'])
    await assert.rejects(ProjectStoryContent.findOneAndUpdate({ slug: 'cortul-imm' }, { $set: { sections: [{ key: 'imagistica', title: 'x'.repeat(81) }] } }, { runValidators: true }))
  } finally {
    if (mongoose.connection.name === database && database.startsWith('mimesiss_story_test_')) await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
})

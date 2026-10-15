import assert from 'node:assert/strict'
import { test } from 'node:test'
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { load } from './helpers/load-ts.mjs'

const base = 'src/components/project-stories/lib/'
const scenes = load(`${base}mimesiss-scene.ts`)
const { projects } = load(`${base}content.ts`, { './mimesiss-scene': scenes })
const { getEventStory } = load(`${base}event-stories.ts`)
const { storyRoutes, storyIdForSlug } = load(`${base}routes.ts`)

test('each published story has a unique route and unrelated project slugs stay dynamic', () => {
  assert.equal(new Set(Object.values(storyRoutes)).size, projects.length)
  for (const project of projects) assert.equal(storyIdForSlug(storyRoutes[project.id].split('/').pop()), project.id)
  assert.equal(storyIdForSlug('un-alt-proiect'), undefined)
  assert.equal(storyIdForSlug('constructor'), undefined)
})

test('all story photographs and 3D textures are included in the production assets', async () => {
  const sources = new Set()
  for (const project of projects) {
    sources.add(project.hero)
    project.gallery.forEach(photo => sources.add(photo.src))
    project.sections?.forEach(section => sources.add(section.image))
    if (project.id !== 'mimesiss') {
      const story = getEventStory(project)
      sources.add(story.intro.src)
      assert.equal(story.chapters.length, 4)
      story.chapters.forEach(chapter => sources.add(chapter.photo.src))
    }
  }
  for (const file of ['membrane.webp', 'concept.webp', 'mimesiss-intro-logo.png', 'photo-1.webp', 'photo-2.webp', 'photo-3.webp', 'photo-4.webp']) sources.add(`/project-stories/neural-space/${file}`)
  for (const source of sources) {
    assert.ok(source.startsWith('/project-stories/') && !source.includes('..'))
    await access(new URL(`../public${source}`, import.meta.url))
  }
})

test('upload processing and responsive delivery share a working native image runtime', async () => {
  const sharp = (await import('sharp')).default
  const { readFile } = await import('node:fs/promises')
  const { optimizeImage } = await import('next/dist/server/image-optimizer.js')
  const original = await readFile(new URL('../public/icons/asmm.png', import.meta.url))
  // Exercise both paths in one process, as the production server does.
  await sharp(original).resize(512).webp().toBuffer()
  const optimized = await optimizeImage({ buffer: original, contentType: 'image/avif', quality: 75, width: 384 })
  const metadata = await sharp(optimized).metadata()
  assert.equal(metadata.width, 384)
  assert.equal(metadata.format, 'heif')
  assert.ok(optimized.length < original.length / 4, 'A thumbnail must not fall back to the full-size original')
})

test('gallery dimensions match the original photographs before lazy loading', async () => {
  const sharp = (await import('sharp')).default
  const { photoDimensions } = load(`${base}photo-dimensions.ts`)
  for (const project of projects) {
    for (const photo of project.gallery) {
      const metadata = await sharp(fileURLToPath(new URL(`../public${photo.src}`, import.meta.url))).metadata()
      assert.deepEqual({ ...photoDimensions[photo.src] }, { width: metadata.width, height: metadata.height }, photo.src)
    }
  }
})


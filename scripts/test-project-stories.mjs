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


test('fixed mobile passages hold the same neuron and clear the view before travel', () => {
  const { mobileStoryFrame, mobileStoryMoments } = load(base + 'mobile-story-timing.ts')
  const moments = mobileStoryMoments([0, 1, 2, 2, 3])
  const stops = [.25, .49, .73, .96]
  const frame = scroll => mobileStoryFrame(scroll, moments, stops)
  const first = moments[0]
  assert.equal(frame(first.enter + .035).opacities[0], 1)
  assert.equal(frame(first.fadeStart).progress, stops[0])
  const fading = frame((first.fadeStart + first.exit) / 2)
  assert.ok(fading.opacities[0] > 0 && fading.opacities[0] < 1)
  assert.equal(fading.progress, stops[0])
  const travel = frame((first.exit + moments[1].enter) / 2)
  assert.ok(travel.opacities.every(value => value === 0))
  assert.ok(travel.progress > stops[0] && travel.progress < stops[1])
  const betweenPassages = frame((moments[2].exit + moments[3].enter) / 2)
  assert.equal(betweenPassages.progress, stops[2], 'Keep the same neuron between both Perspective passages')
  assert.equal(frame(moments[3].enter + .035).opacities[3], 1)
  assert.equal(frame(first.enter + .035).opacities[0], 1, 'Scrolling back restores the passage')
})

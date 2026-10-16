import assert from 'node:assert/strict'
import { test } from 'node:test'
import { load } from './helpers/load-ts.mjs'
const { viewerPhotos, photoSlides } = load('src/lib/photo-viewer.ts')

test('opening a gallery image preserves its index; standalone artwork stays standalone', () => {
  const photos = [{ src: '/one.webp', alt: 'Unu' }, { src: '/two.webp', alt: 'Doi' }]
  assert.equal(viewerPhotos(photos, photos[1]).index, 1)
  assert.equal(viewerPhotos(photos, photos[0]).photos, photos)
  const logo = { src: '/logo.png', alt: 'Siglă' }
  const standalone = viewerPhotos(photos, logo)
  assert.equal(standalone.index, 0)
  assert.equal(standalone.photos.length, 1)
  assert.equal(standalone.photos[0], logo)
})

test('responsive slides preserve portrait proportions and original resolution for zoom', () => {
  const original = { src: '/photo with space.webp', alt: 'Portret', width: 3000, height: 4500 }
  const [slide] = photoSlides([original])
  assert.equal(slide.src, original.src)
  assert.equal(slide.srcSet.at(-1).src, original.src)
  assert.equal(slide.srcSet.at(-1).width, original.width)
  assert.equal(slide.srcSet.at(-1).height, original.height)
  assert.ok(slide.thumbnail.includes('w=128'))
  assert.ok(slide.thumbnail.includes(encodeURIComponent(original.src)))
  assert.equal(new Set(slide.srcSet.map(item => item.width)).size, slide.srcSet.length)
  for (const image of slide.srcSet) assert.equal(image.height / image.width, 1.5)
  assert.equal(photoSlides([{ src: '/logo.png', alt: 'Siglă' }])[0].srcSet, undefined)
})

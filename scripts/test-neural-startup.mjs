import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function load(path, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const loadedModule = { exports: {} }
  runInNewContext(source, { module: loadedModule, exports: loadedModule.exports, DOMException, ...globals, require: name => {
    if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name)
    return dependencies[name]
  } })
  return loadedModule.exports
}
const base = 'src/components/project-stories/lib/'
const loading = load(base + 'neural-loading.ts')

test('fast scrolling prioritizes the destination and the connecting neighbour', () => {
  assert.equal(loading.shouldPrepareNeuralStage(1, 0), true)
  assert.equal(loading.shouldPrepareNeuralStage(2, 0), false)
  assert.equal(loading.shouldPrepareNeuralStage(3, .3), false)
  assert.equal(loading.shouldPrepareNeuralStage(2, .2), true)
  assert.equal(loading.shouldPrepareNeuralStage(3, .97), true)
  assert.deepEqual(Array.from(loading.neuralStagePriority(.97)).slice(0, 2), [3, 2])
  assert.deepEqual(Array.from(loading.requiredNeuralStages(.85)), [2, 3])
  assert.deepEqual(Array.from(loading.requiredNeuralStages(.97)), [3])
  assert.deepEqual(Array.from(loading.requiredNeuralStages(0)), [0, 1])
  for (const progress of [0, .2, .4, .6, .8, 1]) {
    assert.equal(new Set(loading.neuralStagePriority(progress)).size, 4)
    assert.ok(loading.requiredNeuralStages(progress).every(index => index >= 0 && index <= 3))
  }
})

test('scene work waits for a paint and cancellation removes pending animation frames', async () => {
  let sequence = 0
  const frames = new Map()
  const { afterScenePaint } = load(base + 'neural-loading.ts', {}, {
    requestAnimationFrame: callback => { frames.set(++sequence, callback); return sequence },
    cancelAnimationFrame: id => frames.delete(id),
  })
  const abort = new AbortController()
  let ready = false
  const work = afterScenePaint(abort.signal).then(() => { ready = true })
  const first = frames.get(1); frames.delete(1); first()
  await Promise.resolve()
  assert.equal(ready, false)
  const second = frames.get(2); frames.delete(2); second()
  await work
  assert.equal(ready, true)
  const stopped = new AbortController()
  const cancelled = afterScenePaint(stopped.signal)
  stopped.abort()
  await assert.rejects(cancelled, { name: 'AbortError' })
  assert.equal(frames.size, 0)
  await assert.rejects(afterScenePaint(stopped.signal), { name: 'AbortError' })
})

test('worker prepares only the requested neuron and transfers its precomputed bounds', () => {
  const geometry = load(base + 'neural-geometry.ts', { three: THREE, 'three/addons/utils/BufferGeometryUtils.js': { mergeGeometries } })
  const messages = []
  const worker = { postMessage: (message, options) => messages.push({ message, options }) }
  load(base + 'neural-geometry.worker.ts', { './neural-geometry': geometry }, { self: worker })
  worker.onmessage({ data: 0 })
  const first = messages[0]
  assert.equal(first.message.stage, 0)
  assert.deepEqual(Array.from(first.message.geometries, ([name]) => name).sort(), ['body', 'branches0', 'photo0'])
  assert.equal(new Set(first.options.transfer).size, first.options.transfer.length)
  for (const [, payload] of first.message.geometries) {
    assert.ok(payload.sphere.radius > 0)
    assert.equal(payload.sphere.center.length, 3)
    assert.ok(first.options.transfer.includes(payload.attributes.position.array.buffer))
  }
  worker.onmessage({ data: 3 })
  assert.deepEqual(Array.from(messages[1].message.geometries, ([name]) => name).sort(), ['branches3', 'photo3'])
  const initialVertices = first.message.geometries.reduce((sum, [, g]) => sum + g.attributes.position.array.length / 3, 0)
  worker.onmessage({ data: 'background' })
  const background = messages[2].message.geometries
  assert.deepEqual(Array.from(background, ([name]) => name).sort(), ['backgroundBodies', 'backgroundBranches', 'connections'])
  const backgroundVertices = background.reduce((sum, [, g]) => sum + g.attributes.position.array.length / 3, 0)
  assert.ok(initialVertices < backgroundVertices, 'The first paint must not wait for the distant network')
})

test('texture fetch is abortable and decoded bitmap is closed exactly once on disposal', async () => {
  let closed = 0
  const bitmap = { close: () => { closed++ } }
  const controller = new AbortController()
  const { loadNeuralTexture } = load(base + 'neural-texture.ts', { three: THREE }, {
    fetch: async (url, options) => { assert.equal(options.signal, controller.signal); return { ok: true, blob: async () => ({}) } },
    createImageBitmap: async (blob, options) => { assert.equal(options.imageOrientation, 'flipY'); return bitmap },
  })
  const texture = await loadNeuralTexture('/image.webp', controller.signal)
  assert.equal(texture.flipY, false)
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace)
  assert.equal(closed, 0)
  texture.dispose(); texture.dispose()
  assert.equal(closed, 1)
})

test('leaving during bitmap decoding frees the image instead of attaching it to the scene', async () => {
  let closed = 0
  const controller = new AbortController()
  const { loadNeuralTexture } = load(base + 'neural-texture.ts', { three: THREE }, {
    fetch: async () => ({ ok: true, blob: async () => ({}) }),
    createImageBitmap: async () => { controller.abort(); return { close: () => { closed++ } } },
  })
  await assert.rejects(loadNeuralTexture('/image.webp', controller.signal), { name: 'AbortError' })
  assert.equal(closed, 1)
})

test('a missing photograph surfaces an error without starting image decoding', async () => {
  const { loadNeuralTexture } = load(base + 'neural-texture.ts', { three: THREE }, { fetch: async () => ({ ok: false }) })
  await assert.rejects(loadNeuralTexture('/missing.webp', new AbortController().signal), /could not be loaded/)
})

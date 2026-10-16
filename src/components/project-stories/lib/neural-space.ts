import * as THREE from 'three'
import { BRAND } from '@/lib/brand'
import { mimesissScenePhotos } from './mimesiss-scene'
import type { NeuralGeometryStage } from './neural-geometry'
import { afterScenePaint, neuralStagePriority, requiredNeuralStages, shouldPrepareNeuralStage } from './neural-loading'
import { loadNeuralTexture } from './neural-texture'

export type NeuralLayout = { width: number; height: number; narrow: boolean; landscape?: boolean; panelHeight: number; introBottom?: number }
export type NeuralSpace = { update: (progress: number, layout: NeuralLayout) => boolean; dispose: () => void }

const arrivals = [.19, .43, .67, .9]
const departures = [.31, .55, .79, 1.1]
const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 1)
const smooth = (value: number) => value * value * (3 - 2 * value)
const locations = [new THREE.Vector3(-5, -.5, 0), new THREE.Vector3(7, 1.2, -28), new THREE.Vector3(-3, -.8, -58), new THREE.Vector3(5, .5, -90)]

const yieldToBrowser = () => {
  const scheduler = (window as Window & { scheduler?: { yield: () => Promise<void> } }).scheduler
  return scheduler ? scheduler.yield() : new Promise<void>(resolve => window.setTimeout(resolve, 0))
}

const photoSize = (index: number) => index === 0 ? { width: 6.7, height: 6.6 } : { width: 8.35, height: 6.05 }

type GeometryPayload = { attributes: Record<string, { array: Float32Array; itemSize: number }>; index: Uint16Array | Uint32Array; sphere: { center: [number, number, number]; radius: number } }
function geometryLoader(signal: AbortSignal) {
  const worker = new Worker(new URL('./neural-geometry.worker.ts', import.meta.url))
  const pending = new Map<NeuralGeometryStage, { resolve: (value: Record<string, THREE.BufferGeometry>) => void; reject: (reason: Error) => void }>()
  let closed = false
  const dispose = () => {
    if (closed) return
    closed = true
    worker.terminate()
    signal.removeEventListener('abort', dispose)
    pending.forEach(job => job.reject(new DOMException('Scene loading cancelled', 'AbortError')))
    pending.clear()
  }
  signal.addEventListener('abort', dispose, { once: true })
  worker.onerror = () => {
    pending.forEach(job => job.reject(new Error('Scene geometry worker failed.')))
    pending.clear()
    dispose()
  }
  worker.onmessage = (event: MessageEvent<{ stage: NeuralGeometryStage; geometries?: [string, GeometryPayload][]; error?: string }>) => {
    const job = pending.get(event.data.stage)
    if (!job) return
    pending.delete(event.data.stage)
    if (!event.data.geometries) { job.reject(new Error(event.data.error)); return }
    job.resolve(Object.fromEntries(event.data.geometries.map(([name, data]) => {
      const geometry = new THREE.BufferGeometry()
      Object.entries(data.attributes).forEach(([key, attribute]) => geometry.setAttribute(key, new THREE.BufferAttribute(attribute.array, attribute.itemSize)))
      geometry.setIndex(new THREE.BufferAttribute(data.index, 1))
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(...data.sphere.center), data.sphere.radius)
      return [name, geometry]
    })))
  }
  const load = (stage: NeuralGeometryStage) => new Promise<Record<string, THREE.BufferGeometry>>((resolve, reject) => {
    if (closed || signal.aborted) { dispose(); reject(new DOMException('Scene loading cancelled', 'AbortError')); return }
    pending.set(stage, { resolve, reject })
    worker.postMessage(stage)
  })
  return { load, dispose }
}

function photographMaterial(texture: THREE.Texture, index: number, introTexture: THREE.Texture) {
  const photo = mimesissScenePhotos[index]
  const sourceAspect = photo.width / photo.height
  const size = photoSize(index)
  const destinationAspect = size.width / size.height
  const [x, y] = photo.position.split(' ').map(value => parseFloat(value) / 100)
  const repeat = new THREE.Vector2(Math.min(1, destinationAspect / sourceAspect), Math.min(1, sourceAspect / destinationAspect))
  const offset = new THREE.Vector2((1 - repeat.x) * x, (1 - repeat.y) * (1 - y))
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), photo: { value: texture }, crop: { value: repeat }, offset: { value: offset }, introPhoto: { value: introTexture }, introMix: { value: index === 0 ? 1 : 0 }, introSize: { value: new THREE.Vector2(.97, .97 * destinationAspect * 1.25 / (770 / 342)) } },
    vertexShader: `varying vec2 vPhotoUv; uniform float introMix;
      #include <fog_pars_vertex>
      void main() {
        vPhotoUv = uv;
        vec3 photoPosition = position;
        photoPosition.x *= mix(1.0, 1.25, introMix);
        vec4 mvPosition = modelViewMatrix * vec4(photoPosition, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D photo; uniform vec2 crop; uniform vec2 offset;
      uniform sampler2D introPhoto; uniform float introMix; uniform vec2 introSize;
      varying vec2 vPhotoUv;
      #include <fog_pars_fragment>
      void main() {
        vec2 edge = (vPhotoUv - 0.5) * 2.0;
        float angle = atan(edge.y, edge.x);
        float radius = length(edge) * (1.0 + 0.035 * sin(angle * 5.0) + 0.02 * cos(angle * 7.0));
        float alpha = 1.0 - smoothstep(mix(0.73, 0.94, introMix), mix(1.075, 1.2, introMix), radius);
        if (alpha < 0.015) discard;
        vec4 image = texture2D(photo, offset + vPhotoUv * crop);
        vec2 logoUv = (vPhotoUv - 0.5) / introSize + 0.5;
        vec2 logoEdge = abs(logoUv - 0.5) * 2.0;
        float logoRadius = max(logoEdge.x, logoEdge.y);
        float logoMask = 1.0 - smoothstep(0.94, 1.08, logoRadius);
        vec2 croppedLogoUv = vec2(70.0 / 910.0, 234.0 / 584.0) + clamp(logoUv, 0.0, 1.0) * vec2(770.0 / 910.0, 342.0 / 584.0);
        vec3 logo = texture2D(introPhoto, croppedLogoUv).rgb;
        gl_FragColor = vec4(mix(image.rgb * 0.86, logo, introMix), alpha * mix(1.0, logoMask, introMix));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
  })
}

export async function createNeuralSpace(host: HTMLDivElement, onContextLost: () => void, signal: AbortSignal, onInvalidate: () => void = () => {}): Promise<NeuralSpace> {
  let disposed = false
  let backgroundReady = false
  let complete = false
  let requestedProgress = 0
  let presentedProgress: number | null = null
  let resumePreparation: (() => void) | null = null
  const jobs = geometryLoader(signal)
  const textures = new Set<THREE.Texture>()
  const ownedGeometry = new Set<THREE.BufferGeometry>()
  const mobile = window.matchMedia('(max-width: 700px)').matches
  const resources = () => { jobs.dispose(); ownedGeometry.forEach(item => item.dispose()); textures.forEach(item => item.dispose()) }
  const loadTexture = async (src: string) => {
    const url = mobile && !src.endsWith('mimesiss-intro-logo.webp') ? '/_next/image?url=' + encodeURIComponent(src) + '&w=' + (src.includes('membrane') ? 640 : 828) + '&q=85' : src
    const texture = await loadNeuralTexture(url, signal)
    if (disposed || signal.aborted) { texture.dispose(); throw new DOMException('Scene loading cancelled', 'AbortError') }
    texture.colorSpace = THREE.SRGBColorSpace
    textures.add(texture)
    return texture
  }
  const loadGeometry = async (stage: NeuralGeometryStage) => {
    const result = await jobs.load(stage)
    if (disposed || signal.aborted) { Object.values(result).forEach(item => item.dispose()); throw new DOMException('Scene loading cancelled', 'AbortError') }
    Object.values(result).forEach(item => ownedGeometry.add(item))
    return result
  }
  const initial = await Promise.allSettled([
    loadGeometry(0),
    loadTexture('/project-stories/neural-space/membrane.webp'),
    loadTexture('/project-stories/neural-space/mimesiss-intro-logo.webp'),
  ])
  if (signal.aborted || initial[0].status !== 'fulfilled' || initial[1].status !== 'fulfilled' || initial[2].status !== 'fulfilled') {
    resources()
    throw new Error('Scene loading interrupted or failed.')
  }
  const geometry = initial[0].value
  const membrane = initial[1].value
  const introTexture = initial[2].value
  membrane.wrapS = membrane.wrapT = THREE.RepeatWrapping
  membrane.repeat.set(2, 2)
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }) }
  catch (error) { resources(); throw error }
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BRAND.story.background).multiplyScalar(.3)
  scene.fog = new THREE.FogExp2(scene.background, .012)
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 200)
  const material = new THREE.MeshStandardMaterial({ map: membrane, bumpMap: membrane, bumpScale: .08, color: BRAND.story.foreground, roughness: .94, metalness: 0 })
  scene.add(new THREE.AmbientLight(BRAND.story.mutedForeground, 2.4))
  const cameraLight = new THREE.PointLight(BRAND.story.accent, 25, 70, 1.4)
  scene.add(cameraLight)
  const rim = new THREE.DirectionalLight(BRAND.story.foreground, 2.2)
  rim.position.set(-6, 10, 12)
  scene.add(rim)
  const photographs: THREE.Mesh[] = []
  const photoReady = [false, false, false, false]
  const addNeuron = (index: number, meshes: Record<string, THREE.BufferGeometry>, texture: THREE.Texture) => {
    const group = new THREE.Group()
    group.position.copy(locations[index])
    group.rotation.y = [-.08, .12, -.06, .05][index]
    group.rotation.z = [-.045, .02, -.025, .025][index]
    group.add(new THREE.Mesh(geometry.body, material), new THREE.Mesh(meshes['branches' + index], material))
    const photograph = new THREE.Mesh(meshes['photo' + index], photographMaterial(texture, index, introTexture))
    photograph.renderOrder = 1
    group.add(photograph)
    scene.add(group)
    scene.updateMatrixWorld(true)
    group.traverse(object => { object.matrixAutoUpdate = false })
    photographs[index] = photograph
  }
  addNeuron(0, geometry, introTexture)
  scene.traverse(object => { object.matrixAutoUpdate = false })
  cameraLight.matrixAutoUpdate = true
  const instance = crypto.randomUUID()
  let lastSize = ''
  let lastFrame = ''
  const lost = (event: Event) => { event.preventDefault(); if (!disposed) onContextLost() }
  renderer.domElement.addEventListener('webglcontextlost', lost)
  const view = (index: number, layout: NeuralLayout) => {
    const aspect = layout.width / layout.height
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const size = photoSize(index)
    const available = Math.max(100, layout.height - layout.panelHeight - 130)
    const photoHeight = Math.min(layout.height * .36, available)
    const distance = layout.narrow
      ? Math.max(size.width / (.88 * 2 * tangent * aspect), size.height / (photoHeight / layout.height * 2 * tangent)) + 1.4
      : Math.max(size.width / (.46 * 2 * tangent * aspect), size.height / ((layout.landscape ? .65 : .78) * 2 * tangent)) + 1.4
    const screenY = layout.narrow ? (20 + photoHeight / 2) / layout.height : .5
    const offsetY = (screenY * 2 - 1) * (distance - 1.4) * tangent
    const offsetX = layout.narrow ? 0 : .46 * (distance - 1.4) * tangent * aspect
    return locations[index].clone().add(new THREE.Vector3(offsetX, offsetY, distance))
  }
  const update = (progress: number, layout: NeuralLayout) => {
    if (disposed || signal.aborted) return false
    requestedProgress = progress
    resumePreparation?.()
    resumePreparation = null
    const ready = backgroundReady && requiredNeuralStages(progress).every(index => photoReady[index])
    if (!ready) progress = presentedProgress ?? 0
    const frameKey = [progress, layout.width, layout.height, layout.narrow, layout.landscape, layout.panelHeight, layout.introBottom, ready].join(':')
    if (frameKey === lastFrame) return ready
    lastFrame = frameKey
    const size = `${layout.width}:${layout.height}:${layout.narrow}:${layout.landscape}`
    if (size !== lastSize) {
      lastSize = size
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, layout.narrow ? 1.25 : 1.5))
      renderer.setSize(layout.width, layout.height, false)
      camera.aspect = layout.width / layout.height
      camera.updateProjectionMatrix()
    }
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const introDistance = Math.max(6.7 * 1.25 / (.46 * 2 * tangent * camera.aspect), 6.6 / ((layout.landscape ? .65 : .75) * 2 * tangent)) + 1.4
    let position = locations[0].clone().add(new THREE.Vector3(.46 * (introDistance - 1.4) * tangent * camera.aspect, 0, introDistance))
    if (layout.narrow) {
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const available = Math.max(100, layout.height - (layout.introBottom ?? 300) - 105)
      const photoHeight = Math.min(layout.height * .3, available)
      const distance = Math.max(6.7 / (.82 * 2 * tangent * camera.aspect), 6.6 / (photoHeight / layout.height * 2 * tangent)) + 1.4
      const screenY = ((layout.introBottom ?? 300) + 12 + photoHeight / 2) / layout.height
      position = locations[0].clone().add(new THREE.Vector3(0, (screenY * 2 - 1) * (distance - 1.4) * tangent, distance))
    }
    let yaw = 0
    for (let index = 0; index < locations.length; index++) {
      const start = index === 0 ? .05 : departures[index - 1]
      if (progress < start) break
      const end = arrivals[index]
      const amount = smooth(clamp((progress - start) / (end - start)))
      const from = index === 0 ? position.clone() : view(index - 1, layout)
      const to = view(index, layout)
      if (index === 0) position = from.lerp(to, amount)
      else {
        const control = from.clone().lerp(to, .5)
        control.x = Math.max(from.x, to.x) + (layout.narrow ? 4 : 7)
        control.y += 1.5
        position = new THREE.QuadraticBezierCurve3(from, control, to).getPoint(amount)
        yaw = Math.sin(amount * Math.PI) * Math.sign(to.x - from.x) * .07
      }
      if (progress < end) break
    }
    camera.position.copy(position)
    camera.rotation.set(0, yaw, 0)
    camera.updateMatrixWorld(true)
    cameraLight.position.copy(position).add(new THREE.Vector3(-5, 6, -1))
    const introMix = photoReady[0] ? 1 - smooth(clamp((progress - .05) / .12)) : 1;
    (photographs[0].material as THREE.ShaderMaterial).uniforms.introMix.value = introMix
    host.dataset.introLogoOpacity = introMix.toFixed(3)
    renderer.render(scene, camera)
    if (ready) { host.dataset.sceneReady = 'true'; presentedProgress = progress }
    host.dataset.scenePhase = complete ? 'complete' : ready ? 'interactive' : 'preparing'
    host.dataset.loadedPhotos = photoReady.flatMap((ready, index) => ready ? [index] : []).join(',')
    host.dataset.sceneInstance = instance
    host.dataset.engine = 'webgl'
    host.dataset.cameraPosition = position.toArray().map(value => value.toFixed(2)).join(',')
    host.dataset.triangles = String(renderer.info.render.triangles)
    host.dataset.drawCalls = String(renderer.info.render.calls)
    return ready
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    resumePreparation?.()
    resumePreparation = null
    jobs.dispose()
    signal.removeEventListener('abort', dispose)
    renderer.domElement.removeEventListener('webglcontextlost', lost)
    const geometries = new Set<THREE.BufferGeometry>(ownedGeometry), materials = new Set<THREE.Material>()
    scene.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(item => materials.add(item)) } })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(item => item.dispose())
    textures.forEach(texture => texture.dispose())
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
    if (host.dataset.sceneInstance === instance) {
      delete host.dataset.sceneReady
      delete host.dataset.scenePhase
      delete host.dataset.loadedPhotos
      delete host.dataset.sceneInstance
      delete host.dataset.engine
      delete host.dataset.cameraPosition
      delete host.dataset.triangles
      delete host.dataset.drawCalls
      delete host.dataset.introLogoOpacity
    }
  }
  signal.addEventListener('abort', dispose, { once: true })
  try {
    for (const texture of textures) {
      if (signal.aborted) { dispose(); throw new DOMException('Scene loading cancelled', 'AbortError') }
      renderer.initTexture(texture)
      await yieldToBrowser()
    }
    await renderer.compileAsync(scene, camera)
  } catch (error) {
    dispose()
    throw error
  }
  if (signal.aborted) { dispose(); throw new DOMException('Scene loading cancelled', 'AbortError') }
  const changed = () => { lastFrame = ''; onInvalidate() }
  void (async () => {
    await afterScenePaint(signal)
    const [background, firstPhoto] = await Promise.all([
      loadGeometry('background'),
      loadTexture('/project-stories/neural-space/photo-1.webp'),
    ])
    if (disposed || signal.aborted) return
    renderer.initTexture(firstPhoto)
    ;(photographs[0].material as THREE.ShaderMaterial).uniforms.photo.value = firstPhoto
    photoReady[0] = true
    scene.add(new THREE.Mesh(background.backgroundBodies, material), new THREE.Mesh(background.backgroundBranches, material), new THREE.Mesh(background.connections, material))
    scene.updateMatrixWorld(true)
    backgroundReady = true
    changed()
    await yieldToBrowser()
    while (!disposed && !signal.aborted && photoReady.some(ready => !ready)) {
      const index = neuralStagePriority(requestedProgress).find(index => !photoReady[index] && shouldPrepareNeuralStage(index, requestedProgress))
      if (index === undefined) {
        await new Promise<void>(resolve => { resumePreparation = resolve })
        continue
      }
      const [meshes, texture] = await Promise.all([
        loadGeometry(index as NeuralGeometryStage),
        loadTexture('/project-stories/neural-space/photo-' + (index + 1) + '.webp'),
      ])
      if (disposed || signal.aborted) return
      renderer.initTexture(texture)
      await yieldToBrowser()
      if (disposed || signal.aborted) return
      addNeuron(index, meshes, texture)
      photoReady[index] = true
      changed()
      await yieldToBrowser()
    }
    if (disposed || signal.aborted) return
    jobs.dispose()
    complete = true
    changed()
  })().catch(() => { if (!disposed && !signal.aborted) { onContextLost(); dispose() } })
  return { update, dispose }
}

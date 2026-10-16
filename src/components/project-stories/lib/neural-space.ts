import * as THREE from 'three'
import { BRAND } from '@/lib/brand'
import { mimesissScenePhotos } from './mimesiss-scene'

export type NeuralLayout = { width: number; height: number; narrow: boolean; landscape?: boolean; panelHeight: number; introBottom?: number }
export type NeuralSpace = { update: (progress: number, layout: NeuralLayout) => void; dispose: () => void }

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

type GeometryPayload = { attributes: Record<string, { array: Float32Array; itemSize: number }>; index: Uint16Array | Uint32Array }
function loadGeometry(signal: AbortSignal): Promise<Record<string, THREE.BufferGeometry>> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./neural-geometry.worker.ts', import.meta.url))
    const finish = () => { worker.terminate(); signal.removeEventListener('abort', abort) }
    const abort = () => { finish(); reject(new DOMException('Scene loading cancelled', 'AbortError')) }
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    worker.onerror = () => { finish(); reject(new Error('Scene geometry worker failed.')) }
    worker.onmessage = (event: MessageEvent<{ geometries?: [string, GeometryPayload][]; error?: string }>) => {
      finish()
      if (!event.data.geometries) { reject(new Error(event.data.error)); return }
      resolve(Object.fromEntries(event.data.geometries.map(([name, data]) => {
        const geometry = new THREE.BufferGeometry()
        Object.entries(data.attributes).forEach(([key, attribute]) => geometry.setAttribute(key, new THREE.BufferAttribute(attribute.array, attribute.itemSize)))
        geometry.setIndex(new THREE.BufferAttribute(data.index, 1))
        geometry.computeBoundingSphere()
        return [name, geometry]
      })))
    }
    worker.postMessage(null)
  })
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

export async function createNeuralSpace(host: HTMLDivElement, onContextLost: () => void, signal: AbortSignal): Promise<NeuralSpace> {
  const geometryPromise = loadGeometry(signal)
  const loader = new THREE.TextureLoader()
  const mobile = window.matchMedia('(max-width: 700px)').matches
  const assets = ['/project-stories/neural-space/membrane.webp', ...locations.map((_, index) => `/project-stories/neural-space/photo-${index + 1}.webp`), '/project-stories/neural-space/mimesiss-intro-logo.png']
  const [geometryResult, textureResult] = await Promise.allSettled([
    geometryPromise,
    Promise.allSettled(assets.map(src => loader.loadAsync(mobile && src.endsWith('.webp') ? '/_next/image?url=' + encodeURIComponent(src) + '&w=' + (src.includes('membrane') ? 640 : 828) + '&q=85' : src))),
  ])
  const loaded = textureResult.status === 'fulfilled' ? textureResult.value : []
  const geometry = geometryResult.status === 'fulfilled' ? geometryResult.value : {}
  if (signal.aborted || geometryResult.status === 'rejected' || loaded.some(result => result.status === 'rejected')) {
    Object.values(geometry).forEach(item => item.dispose())
    loaded.forEach(result => { if (result.status === 'fulfilled') result.value.dispose() })
    throw new Error('Scene loading interrupted or failed.')
  }
  const textures = loaded.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  textures.forEach(texture => { texture.colorSpace = THREE.SRGBColorSpace })
  const membrane = textures[0]
  membrane.wrapS = membrane.wrapT = THREE.RepeatWrapping
  membrane.repeat.set(2, 2)
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }) }
  catch (error) { textures.forEach(texture => texture.dispose()); Object.values(geometry).forEach(item => item.dispose()); throw error }
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.25
  renderer.domElement.setAttribute('aria-hidden', 'true')
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(BRAND.story.background).multiplyScalar(.3)
  const fog = new THREE.FogExp2(scene.background, .012)
  scene.fog = fog
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 200)
  const material = new THREE.MeshStandardMaterial({ map: membrane, bumpMap: membrane, bumpScale: .08, color: BRAND.story.foreground, roughness: .94, metalness: 0 })
  scene.add(new THREE.AmbientLight(BRAND.story.mutedForeground, 2.4))
  const cameraLight = new THREE.PointLight(BRAND.story.accent, 25, 70, 1.4)
  scene.add(cameraLight)
  const rim = new THREE.DirectionalLight(BRAND.story.foreground, 2.2)
  rim.position.set(-6, 10, 12)
  scene.add(rim)
  const groups: THREE.Group[] = []
  const photographs: THREE.Mesh[] = []
  for (const [index, location] of locations.entries()) {
    const group = new THREE.Group()
    group.position.copy(location)
    group.rotation.y = [-.08, .12, -.06, .05][index]
    group.rotation.z = [-.045, .02, -.025, .025][index]
    group.add(new THREE.Mesh(geometry.body, material), new THREE.Mesh(geometry['branches' + index], material))
    const photograph = new THREE.Mesh(geometry['photo' + index], photographMaterial(textures[index + 1], index, textures[textures.length - 1]))
    photograph.renderOrder = 1
    group.add(photograph)
    scene.add(group)
    groups.push(group)
    photographs.push(photograph)
  }
  scene.add(new THREE.Mesh(geometry.backgroundBodies, material), new THREE.Mesh(geometry.backgroundBranches, material), new THREE.Mesh(geometry.connections, material))
  scene.updateMatrixWorld(true)
  scene.traverse(object => { object.matrixAutoUpdate = false })
  cameraLight.matrixAutoUpdate = true
  let disposed = false
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
      : layout.landscape ? size.height / (.65 * 2 * tangent) + 1.4 : 10
    const screenY = layout.narrow ? (20 + photoHeight / 2) / layout.height : layout.landscape ? .43 : .5
    const offsetY = (screenY * 2 - 1) * (distance - 1.4) * tangent
    const offsetX = layout.narrow ? 0 : (layout.landscape ? .5 : .19) * (distance - 1.4) * tangent * aspect
    return locations[index].clone().add(new THREE.Vector3(offsetX, offsetY, distance))
  }
  const update = (progress: number, layout: NeuralLayout) => {
    if (disposed || signal.aborted) return
    const frameKey = [progress, layout.width, layout.height, layout.narrow, layout.landscape, layout.panelHeight, layout.introBottom].join(':')
    if (frameKey === lastFrame) return
    lastFrame = frameKey
    const size = `${layout.width}:${layout.height}:${layout.narrow}:${layout.landscape}`
    if (size !== lastSize) {
      lastSize = size
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, layout.narrow ? 1.25 : 1.5))
      renderer.setSize(layout.width, layout.height, false)
      camera.aspect = layout.width / layout.height
      camera.updateProjectionMatrix()
    }
    let position = new THREE.Vector3(layout.narrow ? -3 : -2, layout.narrow ? 7 : 1.8, layout.narrow ? 38 : 20)
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
    const introMix = 1 - smooth(clamp((progress - .05) / .12));
    (photographs[0].material as THREE.ShaderMaterial).uniforms.introMix.value = introMix
    host.dataset.introLogoOpacity = introMix.toFixed(3)
    renderer.render(scene, camera)
    host.dataset.sceneReady = 'true'
    host.dataset.sceneInstance = instance
    host.dataset.engine = 'webgl'
    host.dataset.cameraPosition = position.toArray().map(value => value.toFixed(2)).join(',')
    host.dataset.triangles = String(renderer.info.render.triangles)
    host.dataset.drawCalls = String(renderer.info.render.calls)
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    renderer.domElement.removeEventListener('webglcontextlost', lost)
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>()
    scene.traverse(object => { if (object instanceof THREE.Mesh) { geometries.add(object.geometry); const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(item => materials.add(item)) } })
    geometries.forEach(geometry => geometry.dispose())
    materials.forEach(item => item.dispose())
    textures.forEach(texture => texture.dispose())
    renderer.dispose()
    renderer.forceContextLoss()
    renderer.domElement.remove()
    if (host.dataset.sceneInstance === instance) {
      delete host.dataset.sceneReady
      delete host.dataset.sceneInstance
      delete host.dataset.engine
      delete host.dataset.cameraPosition
      delete host.dataset.triangles
      delete host.dataset.drawCalls
      delete host.dataset.introLogoOpacity
    }
  }
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
  return { update, dispose }
}

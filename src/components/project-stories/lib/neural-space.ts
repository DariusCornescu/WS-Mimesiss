import * as THREE from 'three'
import { BRAND } from '@/lib/brand'
import { mimesissScenePhotos } from './mimesiss-scene'
import type { NeuralGeometryStage } from './neural-geometry'
import { afterScenePaint, neuralStagePriority, requiredNeuralStages, shouldPrepareNeuralStage } from './neural-loading'
import { loadNeuralTexture } from './neural-texture'

export type NeuralLayout = { width: number; height: number; narrow: boolean; landscape?: boolean; panelHeight: number; introBottom?: number }
export type NeuralSpace = { update: (progress: number, layout: NeuralLayout) => boolean; animate: (time: number) => void; dispose: () => void }

const arrivals = [.19, .43, .67, .9]
const departures = [.31, .55, .79, 1.1]
const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 1)
const smooth = (value: number) => value * value * (3 - 2 * value)
const locations = [new THREE.Vector3(-5, -.5, 0), new THREE.Vector3(7, 1.2, -28), new THREE.Vector3(-3, -.8, -58), new THREE.Vector3(5, .5, -90)]

const yieldToBrowser = () => {
  const scheduler = (window as Window & { scheduler?: { yield: () => Promise<void> } }).scheduler
  return scheduler ? scheduler.yield() : new Promise<void>(resolve => window.setTimeout(resolve, 0))
}

// Copper emissive uses a deeper mix of the brand copper (copper pulled toward its own square) so that
// bright light stays orange-red after tone mapping instead of washing out to salmon.
const deepCopper = () => { const c = new THREE.Color(BRAND.story.copper); return c.clone().lerp(c.clone().multiply(c), .5) }
// Shared per-frame state: the calm-zone switch (phones keep copy at the bottom, desktop on the right).
const narrowFlag = { value: 0 }
const calmMask = `float calmSide(vec2 ndc, float narrow) { return narrow > 0.5 ? -ndc.y - 0.3 : ndc.x; }`

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

function photographMaterial(texture: THREE.Texture, index: number) {
  const photo = mimesissScenePhotos[index]
  const sourceAspect = photo.width / photo.height
  const size = photoSize(index)
  const destinationAspect = size.width / size.height
  const [x, y] = photo.position.split(' ').map(value => parseFloat(value) / 100)
  const repeat = new THREE.Vector2(Math.min(1, destinationAspect / sourceAspect), Math.min(1, sourceAspect / destinationAspect))
  const offset = new THREE.Vector2((1 - repeat.x) * x, (1 - repeat.y) * (1 - y))
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), photo: { value: texture }, crop: { value: repeat }, offset: { value: offset }, reveal: { value: index === 0 ? 0 : 1 }, fire: { value: 0 }, rimColor: { value: deepCopper() } },
    vertexShader: `varying vec2 vPhotoUv;
      #include <fog_pars_vertex>
      void main() {
        vPhotoUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform sampler2D photo; uniform vec2 crop; uniform vec2 offset; uniform float reveal; uniform float fire; uniform vec3 rimColor;
      varying vec2 vPhotoUv;
      #include <fog_pars_fragment>
      void main() {
        vec2 edge = (vPhotoUv - 0.5) * 2.0;
        float angle = atan(edge.y, edge.x);
        float radius = length(edge) * (1.0 + 0.035 * sin(angle * 5.0) + 0.02 * cos(angle * 7.0));
        // The photograph opens from the centre of the cell as the camera arrives.
        float alpha = (1.0 - smoothstep(mix(0.0, 0.73, reveal), mix(0.3, 1.075, reveal), radius)) * reveal;
        if (alpha < 0.015) discard;
        vec4 image = texture2D(photo, offset + vPhotoUv * crop);
        // Lit lip at the window edge: the membrane is thin there, so the cell glows through it (stronger on arrival).
        float lip = smoothstep(0.74, 0.95, radius) * (1.0 - smoothstep(0.97, 1.1, radius));
        vec3 lit = image.rgb * 0.86 + rimColor * lip * (0.3 + 0.7 * fire) * reveal;
        gl_FragColor = vec4(lit, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
  })
}

// Copper impulses travelling inside the neurites (looping) and along the axons
// between neurons, where the leading pulse follows the camera's own journey.
const arrive = { value: new THREE.Vector4(-1, -1, -1, -1) }
function signalMaterial(kind: 'neurite' | 'axon', density: number) {
  return new THREE.ShaderMaterial({
    uniforms: { arrive, narrow: narrowFlag, time: { value: 0 }, travel: { value: new THREE.Vector3() }, color: { value: deepCopper() }, core: { value: new THREE.Color(BRAND.story.foreground) }, density: { value: density } },
    defines: kind === 'axon' ? { AXON: '' } : {},
    vertexShader: `uniform vec3 travel; uniform vec4 arrive; uniform float narrow;
      ${calmMask}
      attribute float ${kind === 'axon' ? 'segment' : 'phase'};
      varying float vAlong; varying float vKey; varying float vFresnel; varying float vDepth; varying float vBurst; varying float vAct; varying float vCalm;
      void main() {
        vAlong = uv.x;
        // Which neuron this mesh belongs to, read from its position along the journey.
        float nz = modelMatrix[3].z;
        int who = nz > -14.0 ? 0 : nz > -43.0 ? 1 : nz > -74.0 ? 2 : 3;
        vBurst = who == 0 ? arrive.x : who == 1 ? arrive.y : who == 2 ? arrive.z : arrive.w;
        vAct = 1.0 - smoothstep(14.0, 46.0, abs(cameraPosition.z - nz));
        #ifdef AXON
          vKey = segment < 0.5 ? travel.x : segment < 1.5 ? travel.y : travel.z;
        #else
          vKey = phase;
        #endif
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vec3 viewNormal = normalize(normalMatrix * normal);
        vFresnel = 1.0 - abs(dot(viewNormal, normalize(-mvPosition.xyz)));
        vDepth = -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        // Mask: pulses fade out over the copy side (axons keep a faint floor so the journey stays readable).
        float side = calmSide(gl_Position.xy / gl_Position.w, narrow);
        #ifdef AXON
          vCalm = 1.0 - 0.7 * smoothstep(0.0, 0.3, side);
        #else
          vCalm = 1.0 - 0.96 * smoothstep(-0.05, 0.22, side);
        #endif
      }`,
    fragmentShader: `uniform float time; uniform vec3 color; uniform vec3 core; uniform float density;
      varying float vAlong; varying float vKey; varying float vFresnel; varying float vDepth; varying float vBurst; varying float vAct; varying float vCalm;
      // A soft leading edge and a long fading tail, so the signal reads as light, not as a band.
      float pulse(float head, float along) {
        float d = head - along;
        return d >= 0.0 ? exp(-d * 3.5) : exp(d * 28.0);
      }
      void main() {
        float glow;
        #ifdef AXON
          // Travel 0..1 is the camera's progress between two neurons; a faint train keeps the axon alive.
          float lead = pulse(vKey * 1.15 - 0.05, vAlong) * smoothstep(0.0, 0.04, vKey) * (1.0 - smoothstep(0.96, 1.0, vKey));
          glow = lead + 0.18 * pulse(fract(time * 0.09), vAlong);
        #else
          bool fork = vKey >= 10.0;
          float key = fork ? vKey - 10.0 : vKey;
          // Fork shells continue the parent branch from its junction, so one impulse splits in two.
          float along = fork ? 0.55 + vAlong * 0.45 : vAlong;
          float cycle = time * 0.16 + key;
          float firing = step(0.48, fract(sin((floor(cycle) + key * 17.0) * 43.7) * 9631.3));
          float idle = pulse(fract(cycle) * 1.2, along) * firing * (1.0 - smoothstep(0.75, 1.0, along));
          // On arrival every branch fires once, staggered, with its head tied to scroll progress.
          float t = vBurst;
          float burst = t > 0.0 ? pulse(t * 1.5 - key * 0.4, along) * (1.0 - smoothstep(0.85, 1.35, t)) * (1.0 - smoothstep(0.8, 1.0, along)) : 0.0;
          glow = max(idle * (0.25 + 0.5 * vAct), burst * 1.5);
        #endif
        float fog = exp(-density * density * vDepth * vDepth);
        // Mostly edge light, so the branch looks lit from inside rather than painted.
        float rim = 0.12 + 0.88 * pow(vFresnel, 2.2);
        float intensity = glow * rim * fog * vCalm;
        if (intensity < 0.004) discard;
        gl_FragColor = vec4(mix(color, core, glow * glow * 0.07) * intensity * 1.9, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
}

// ---- Depth: spores (from the depth-and-particles variant) ----------------------------------
const mulberry = (start: number) => () => { start = (start + 0x6D2B79F5) | 0; let t = Math.imul(start ^ (start >>> 15), 1 | start); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

// Floating spores: one Points draw call. Each one belongs to a depth layer that follows the
// camera at its own rate (parallax), is lit by the camera light, becomes a soft bokeh disc when
// close, and fades out over the half of the screen reserved for the copy.
function sporeField(count: number) {
  const random = mulberry(20260501)
  const position = new Float32Array(count * 3), seed = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const gauss = () => (random() + random() + random() - 1.5) / 1.5
    position.set([gauss() * 15, gauss() * 8, random() * 70], i * 3)
    const layer = Math.pow(random(), 1.4)
    seed.set([.25 + layer * .75, random() < .035 ? .28 + random() * .22 : .07 + Math.pow(random(), 2.2) * .2, random()], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
  geometry.setAttribute('seed', new THREE.BufferAttribute(seed, 3))
  return geometry
}
function sporeMaterial(density: number) {
  return new THREE.ShaderMaterial({
    uniforms: { cam: { value: new THREE.Vector3() }, light: { value: new THREE.Vector3() }, time: { value: 0 }, scale: { value: 600 }, narrow: { value: 0 }, density: { value: density }, color: { value: new THREE.Color(BRAND.story.copper) }, core: { value: new THREE.Color(BRAND.story.foreground) } },
    vertexShader: `uniform vec3 cam; uniform vec3 light; uniform float time; uniform float scale; uniform float narrow;
      attribute vec3 seed;
      varying float vAlpha; varying float vTone; varying float vSize;
      const float L = 70.0;
      void main() {
        // Layer rate seed.x: 1 stays fixed in the world, lower values travel with the camera.
        float rel = mod(position.z + seed.x * cam.z, L);
        vec3 world = vec3(cam.xy * 0.6 + position.xy, cam.z + 4.0 - rel);
        world.x += sin(time * 0.11 + seed.z * 40.0) * 0.5;
        world.y += cos(time * 0.09 + seed.z * 27.0) * 0.4;
        vec4 mv = viewMatrix * vec4(world, 1.0);
        float depth = max(0.5, -mv.z);
        vec4 clip = projectionMatrix * mv;
        vec2 ndc = clip.xy / clip.w;
        float size = clamp(seed.y * scale / depth, 2.0, narrow > 0.5 ? 44.0 : 80.0);
        float fade = smoothstep(5.0, 11.0, rel) * (1.0 - smoothstep(L - 20.0, L, rel));
        float dl = distance(world, light);
        float lit = 0.3 + 1.6 / (1.0 + 0.018 * dl * dl);
        float twinkle = 0.78 + 0.22 * sin(time * 0.8 + seed.z * 61.0);
        // Calm zone: the right half on desktop, the bottom third on phones.
        float side = narrow > 0.5 ? -ndc.y - 0.3 : ndc.x;
        float calm = 1.0 - 0.96 * smoothstep(-0.25, 0.15, side);
        float energy = 6.0 / max(6.0, size); // big bokeh discs spread the same light over more pixels
        vSize = size; vAlpha = fade * lit * twinkle * calm * (0.5 + 0.5 * energy * energy) * 1.7 * (1.0 - 0.55 * smoothstep(12.0, 40.0, size)) * exp(-depth * 0.012);
        vTone = seed.z;
        gl_PointSize = size;
        gl_Position = clip;
      }`,
    fragmentShader: `uniform vec3 color; uniform vec3 core;
      varying float vAlpha; varying float vTone; varying float vSize;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        if (r > 1.0) discard;
        float halo = pow(1.0 - r, 2.0); float ring = smoothstep(0.65, 0.92, r) * (1.0 - smoothstep(0.92, 1.0, r)) * smoothstep(14.0, 40.0, vSize) * 0.3;
        float spark = exp(-r * r * 9.0);
        vec3 tint = mix(color, core, vTone * vTone * 0.7);
        gl_FragColor = vec4(tint * (halo * 0.35 + spark * 0.9 + ring) * vAlpha * 1.4, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
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
    const url = mobile ? '/_next/image?url=' + encodeURIComponent(src) + '&w=' + (src.includes('membrane') ? 640 : 828) + '&q=85' : src
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
  ])
  if (signal.aborted || initial[0].status !== 'fulfilled' || initial[1].status !== 'fulfilled') {
    resources()
    throw new Error('Scene loading interrupted or failed.')
  }
  const geometry = initial[0].value
  const membrane = initial[1].value
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
  const fogDensity = .016
  scene.fog = new THREE.FogExp2(scene.background, fogDensity)
  const neuriteSignals = signalMaterial('neurite', fogDensity)
  const axonSignals = signalMaterial('axon', fogDensity)
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 200)
  const material = new THREE.MeshStandardMaterial({ map: membrane, bumpMap: membrane, bumpScale: .08, color: BRAND.story.foreground, roughness: .94, metalness: 0 })
  // One compile hook for the shared membrane: far haze (depth), edge and copy-side shading (replaces a
  // fullscreen vignette pass), and the synaptic flash with its travelling wave (masked on the copy side).
  const copper = deepCopper()
  const hazeColor = new THREE.Color(BRAND.story.copper).multiplyScalar(.2).add(new THREE.Color(BRAND.story.background).multiplyScalar(.4))
  material.onBeforeCompile = shader => {
    shader.uniforms.arrive = arrive
    shader.uniforms.copper = { value: copper }
    shader.uniforms.centers = { value: locations }
    shader.uniforms.hazeColor = { value: hazeColor }
    shader.uniforms.narrow = narrowFlag
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec2 vNdc; varying float vHazeY;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vHazeY = vWPos.y; vNdc = gl_Position.xy / gl_Position.w;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vWPos; varying vec2 vNdc; varying float vHazeY; uniform vec4 arrive; uniform vec3 copper; uniform vec3 centers[4]; uniform vec3 hazeColor; uniform float narrow;
        ${calmMask}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float spark = 0.0;
        for (int i = 0; i < 4; i++) {
          float t = i == 0 ? arrive.x : i == 1 ? arrive.y : i == 2 ? arrive.z : arrive.w;
          if (t > 0.0 && t < 1.8) {
            float d = length(vWPos - centers[i]);
            float x = (d - t * 15.0) / 1.7;
            spark += exp(-x * x) * exp(-t * 1.1) * 0.7 + exp(-pow(d / 6.5, 2.0)) * exp(-t * 4.0) * smoothstep(0.0, 0.05, t) * 1.1;
          }
        }
        float lum = dot(diffuseColor.rgb, vec3(0.333));
        float sideMask = 1.0 - 0.94 * smoothstep(0.0, 0.3, calmSide(vNdc, narrow));
        totalEmissiveRadiance += copper * spark * sideMask * 0.62 * (0.15 + 2.2 * smoothstep(0.05, 0.4, lum));`)
      .replace('#include <fog_fragment>', `#ifdef USE_FOG
          float hz = smoothstep(12.0, 65.0, vFogDepth) * (0.62 + 0.2 * smoothstep(3.0, -6.0, vHazeY));
          float luma = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(luma), hz * 0.55);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, hazeColor, hz);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth));
        #endif
        // Frame edge and copy side fall to near-black (the job of the former vignette pass).
        float rr = length(vNdc) / 1.41;
        float shade = smoothstep(0.5, 1.05, rr) * 0.6 + smoothstep(0.0, 0.6, calmSide(vNdc, narrow)) * 0.3;
        gl_FragColor.rgb *= 1.0 - clamp(shade, 0.0, 0.85);`)
  }
  const sporeShader = sporeMaterial(fogDensity)
  const spores = new THREE.Points(sporeField(mobile ? 420 : 900), sporeShader)
  spores.frustumCulled = false
  spores.renderOrder = 3
  scene.add(spores)
  scene.add(new THREE.AmbientLight(BRAND.story.mutedForeground, 2.4))
  const cameraLight = new THREE.PointLight(BRAND.story.accent, 25, 70, 1.4)
  scene.add(cameraLight)
  const rim = new THREE.DirectionalLight(BRAND.story.foreground, 2.2)
  rim.position.set(-6, 10, 12)
  scene.add(rim)
  const photographs: THREE.Mesh[] = []
  const photoReady = [false, false, false, false]
  const neuronParts: { group: THREE.Group; signals?: THREE.Mesh }[] = []
  const addNeuron = (index: number, meshes: Record<string, THREE.BufferGeometry>, texture: THREE.Texture) => {
    const group = new THREE.Group()
    group.position.copy(locations[index])
    group.rotation.y = [-.08, .12, -.06, .05][index]
    group.rotation.z = [-.045, .02, -.025, .025][index]
    group.add(new THREE.Mesh(geometry.body, material), new THREE.Mesh(meshes['branches' + index], material))
    const photograph = new THREE.Mesh(meshes['photo' + index], photographMaterial(texture, index))
    photograph.renderOrder = 1
    group.add(photograph)
    // Looping neurite signals only animate on larger screens, so phones skip the extra draw call.
    if (!mobile) {
      const signals = new THREE.Mesh(meshes['signals' + index], neuriteSignals)
      signals.renderOrder = 2
      group.add(signals)
      neuronParts[index] = { group, signals }
    } else neuronParts[index] = { group }
    scene.add(group)
    scene.updateMatrixWorld(true)
    group.traverse(object => { object.matrixAutoUpdate = false })
    photographs[index] = photograph
  }
  // The first photograph is hidden until the camera moves, so the membrane can stand in for it.
  addNeuron(0, geometry, membrane)
  scene.traverse(object => { object.matrixAutoUpdate = false })
  cameraLight.matrixAutoUpdate = true
  const instance = crypto.randomUUID()
  let lastSize = ''
  let lastFrame = ''
  let rendered = false
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
      sporeShader.uniforms.scale.value = layout.height * Math.min(window.devicePixelRatio || 1, layout.narrow ? 1.25 : 1.5) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
      sporeShader.uniforms.narrow.value = layout.narrow ? 1 : 0
      narrowFlag.value = layout.narrow ? 1 : 0
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
    // Each photograph opens only as the camera approaches its neuron, so distant ones never sit behind the copy.
    const reveal = photoReady[0] ? smooth(clamp((progress - .05) / .12)) : 0
    photographs.forEach((photograph, index) => {
      const amount = index === 0 ? reveal : smooth(clamp((progress - departures[index - 1]) / ((arrivals[index] - departures[index - 1]) * .7)))
      ;(photograph.material as THREE.ShaderMaterial).uniforms.reveal.value = amount
    })
    host.dataset.introReveal = reveal.toFixed(3)
    sporeShader.uniforms.cam.value.copy(position)
    sporeShader.uniforms.light.value.copy(cameraLight.position)
    // Draw-call budget: neurons the haze has already swallowed are not drawn at all, and the neurite
    // signal shells only exist near the camera (the shader already fades them out beyond ~46 units).
    neuronParts.forEach((part, index) => {
      const away = Math.abs(position.z - locations[index].z)
      part.group.visible = away < 64
      if (part.signals) part.signals.visible = away < 40
      const t = (progress - arrivals[index]) / .14
      photographs[index].visible = (photographs[index].material as THREE.ShaderMaterial).uniforms.reveal.value > .01
      ;(photographs[index].material as THREE.ShaderMaterial).uniforms.fire.value = t > 0 ? Math.exp(-t * 2.5) : 0
    })
    arrive.value.set(...arrivals.map(value => (progress - value) / .14) as [number, number, number, number])
    axonSignals.uniforms.travel.value.set(...[0, 1, 2].map(index => clamp((progress - departures[index]) / (arrivals[index + 1] - departures[index]))) as [number, number, number])
    renderer.render(scene, camera)
    rendered = true
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
  // Advances the idle signal animation without moving the camera.
  const animate = (time: number) => {
    if (disposed || !rendered) return
    neuriteSignals.uniforms.time.value = time
    axonSignals.uniforms.time.value = time
    sporeShader.uniforms.time.value = time
    renderer.render(scene, camera)
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
    scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Points) { geometries.add(object.geometry); const list = Array.isArray(object.material) ? object.material : [object.material]; list.forEach(item => materials.add(item)) } })
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
      delete host.dataset.introReveal
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
    const axons = new THREE.Mesh(background.connectionSignals, axonSignals)
    axons.renderOrder = 2
    scene.add(new THREE.Mesh(background.backgroundBodies, material), new THREE.Mesh(background.backgroundBranches, material), new THREE.Mesh(background.connections, material), axons)
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
  return { update, animate, dispose }
}

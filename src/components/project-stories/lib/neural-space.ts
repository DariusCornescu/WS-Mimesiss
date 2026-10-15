import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { BRAND } from '@/lib/brand'
import { mimesissScenePhotos } from './mimesiss-scene'

export type NeuralLayout = { width: number; height: number; narrow: boolean; landscape?: boolean; panelHeight: number; introBottom?: number }
export type NeuralSpace = { update: (progress: number, layout: NeuralLayout) => void; dispose: () => void }

const arrivals = [.19, .43, .67, .9]
const departures = [.31, .55, .79, 1.1]
const clamp = (value: number) => THREE.MathUtils.clamp(value, 0, 1)
const smooth = (value: number) => value * value * (3 - 2 * value)
const locations = [new THREE.Vector3(-5, -.5, 0), new THREE.Vector3(7, 1.2, -28), new THREE.Vector3(-3, -.8, -58), new THREE.Vector3(5, .5, -90)]
const shape = { x: 4.7, y: 3.5, z: 1.35 }

function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
}

function taperedBranch(points: THREE.Vector3[], radius: number, segments: number, sides: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, segments, 1, sides, false)
  const positions = geometry.getAttribute('position')
  for (let ring = 0; ring <= segments; ring++) {
    const t = ring / segments
    const center = curve.getPointAt(t)
    const thickness = .015 + radius * Math.pow(1 - t, .85)
    for (let side = 0; side <= sides; side++) {
      const index = ring * (sides + 1) + side
      const point = new THREE.Vector3().fromBufferAttribute(positions, index).sub(center).multiplyScalar(thickness).add(center)
      positions.setXYZ(index, point.x, point.y, point.z)
    }
  }
  geometry.computeVertexNormals()
  return geometry
}

function organicBody(detail: number) {
  const geometry = new THREE.SphereGeometry(1, detail, Math.round(detail * .65))
  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index++) {
    const point = new THREE.Vector3().fromBufferAttribute(positions, index)
    const ripple = 1 + .045 * Math.sin(point.x * 8 + point.y * 3) * Math.cos(point.y * 7 - point.z * 4)
    positions.setXYZ(index, point.x * shape.x * ripple, point.y * shape.y * ripple, point.z * shape.z * ripple)
  }
  geometry.computeVertexNormals()
  return geometry
}

function neurites(seed: number, count: number, detailed: boolean) {
  const random = seededRandom(seed)
  const geometries: THREE.BufferGeometry[] = []
  for (let branch = 0; branch < count; branch++) {
    const angle = branch / count * Math.PI * 2 + (random() - .5) * .28
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), (random() - .5) * .45)
    const root = new THREE.Vector3(direction.x * shape.x * .77, direction.y * shape.y * .77, -.3)
    const length = 7 + random() * 7
    const points = [root, root.clone().addScaledVector(direction, 2), root.clone().addScaledVector(direction, length * .55).add(new THREE.Vector3((random() - .5) * 3, (random() - .5) * 3, (random() - .5) * 5)), root.clone().addScaledVector(direction, length).add(new THREE.Vector3((random() - .5) * 4, (random() - .5) * 4, (random() - .5) * 8))]
    geometries.push(taperedBranch(points, detailed ? .35 + random() * .15 : .22, detailed ? 26 : 16, detailed ? 6 : 4))
    if (detailed) {
      for (let fork = 0; fork < 2; fork++) {
        const origin = points[2].clone()
        const forkAngle = angle + (fork === 0 ? -.55 : .6)
        const reach = 4 + random() * 4
        const end = origin.clone().add(new THREE.Vector3(Math.cos(forkAngle) * reach, Math.sin(forkAngle) * reach, (random() - .5) * 7))
        const middle = origin.clone().lerp(end, .5).add(new THREE.Vector3(0, (random() - .5) * 2, 1))
        geometries.push(taperedBranch([origin, middle, end], .11, 14, 4))
      }
    }
  }
  const merged = mergeGeometries(geometries)!
  geometries.forEach(geometry => geometry.dispose())
  return merged
}

const photoSize = (index: number) => index === 0 ? { width: 6.7, height: 6.6 } : { width: 8.35, height: 6.05 }

function photographGeometry(index: number) {
  const size = photoSize(index)
  const geometry = new THREE.PlaneGeometry(size.width, size.height, 28, 22)
  const positions = geometry.getAttribute('position')
  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index) / shape.x
    const y = positions.getY(index) / shape.y
    positions.setZ(index, shape.z * Math.sqrt(Math.max(.06, 1 - x * x - y * y)) + .12)
  }
  geometry.computeVertexNormals()
  return geometry
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
        float alpha = 1.0 - smoothstep(0.73, 1.075, radius);
        if (alpha < 0.015) discard;
        vec4 image = texture2D(photo, offset + vPhotoUv * crop);
        vec2 logoUv = (vPhotoUv - 0.5) / introSize + 0.5;
        vec2 logoEdge = abs(logoUv - 0.5) * 2.0;
        float logoRadius = length(logoEdge);
        float logoMask = 1.0 - smoothstep(0.68, 1.12, logoRadius);
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

export async function createNeuralSpace(host: HTMLDivElement, buttons: (HTMLButtonElement | null)[], onContextLost: () => void): Promise<NeuralSpace> {
  const loader = new THREE.TextureLoader()
  const assets = ['/project-stories/neural-space/membrane.webp', ...locations.map((_, index) => `/project-stories/neural-space/photo-${index + 1}.webp`), '/project-stories/neural-space/mimesiss-intro-logo.png']
  const loaded = await Promise.allSettled(assets.map(src => loader.loadAsync(src)))
  const textures = loaded.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
  if (loaded.some(result => result.status === 'rejected')) { textures.forEach(texture => texture.dispose()); throw new Error('The neural scene images could not be loaded.') }
  textures.forEach(texture => { texture.colorSpace = THREE.SRGBColorSpace })
  const membrane = textures[0]
  membrane.wrapS = membrane.wrapT = THREE.RepeatWrapping
  membrane.repeat.set(2, 2)
  let renderer: THREE.WebGLRenderer
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }) }
  catch (error) { textures.forEach(texture => texture.dispose()); throw error }
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
  locations.forEach((location, index) => {
    const group = new THREE.Group()
    group.position.copy(location)
    group.rotation.y = [-.08, .12, -.06, .05][index]
    group.rotation.z = [-.045, .02, -.025, .025][index]
    group.add(new THREE.Mesh(organicBody(44), material), new THREE.Mesh(neurites(300 + index, 9, true), material))
    const photograph = new THREE.Mesh(photographGeometry(index), photographMaterial(textures[index + 1], index, textures[textures.length - 1]))
    photograph.renderOrder = 1
    group.add(photograph)
    scene.add(group)
    groups.push(group)
    photographs.push(photograph)
  })
  const random = seededRandom(1862)
  const backgroundBodies: THREE.BufferGeometry[] = []
  const backgroundBranches: THREE.BufferGeometry[] = []
  for (let index = 0; index < 22; index++) {
    const group = new THREE.Group()
    group.position.set((index % 2 ? -1 : 1) * (14 + random() * 15), (random() - .5) * 24, 8 - index * 6.8)
    group.rotation.set(random(), random(), random() * Math.PI)
    group.scale.setScalar(.55 + random() * .55)
    group.updateMatrix()
    backgroundBodies.push(organicBody(16).applyMatrix4(group.matrix))
    backgroundBranches.push(neurites(800 + index, 6, false).applyMatrix4(group.matrix))
  }
  const mergedBodies = mergeGeometries(backgroundBodies)!
  const mergedBranches = mergeGeometries(backgroundBranches)!
  backgroundBodies.forEach(geometry => geometry.dispose())
  backgroundBranches.forEach(geometry => geometry.dispose())
  scene.add(new THREE.Mesh(mergedBodies, material), new THREE.Mesh(mergedBranches, material))
  const connections: THREE.BufferGeometry[] = []
  locations.slice(1).forEach((location, index) => {
    const from = locations[index].clone().add(new THREE.Vector3(3.5, -2, -1))
    const to = location.clone().add(new THREE.Vector3(-3.5, -2, -1))
    const middle = from.clone().lerp(to, .5).add(new THREE.Vector3(7, -5, -3))
    connections.push(taperedBranch([from, middle, to], .28, 36, 6))
  })
  const mergedConnections = mergeGeometries(connections)!
  connections.forEach(geometry => geometry.dispose())
  scene.add(new THREE.Mesh(mergedConnections, material))
  scene.updateMatrixWorld(true)
  let disposed = false
  const instance = crypto.randomUUID()
  let lastSize = ''
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
    if (disposed) return
    const size = `${layout.width}:${layout.height}:${layout.narrow}:${layout.landscape}`
    if (size !== lastSize) {
      lastSize = size
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, layout.narrow ? 1.25 : 1.5))
      renderer.setSize(layout.width, layout.height, false)
      camera.aspect = layout.width / layout.height
      camera.updateProjectionMatrix()
    }
    let position = new THREE.Vector3(layout.narrow ? -3 : 0, layout.narrow ? 7 : 1.4, layout.narrow ? 38 : 17)
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
    groups.forEach((group, index) => {
      const button = buttons[index]
      if (!button) return
      const center = group.position.clone().applyMatrix4(camera.matrixWorldInverse)
      const size = photoSize(index)
      const x = size.width * .455 * (index === 0 ? 1 + .25 * introMix : 1), y = size.height * .447
      const corners = [new THREE.Vector3(-x, -y, 1.4), new THREE.Vector3(x, -y, 1.4), new THREE.Vector3(-x, y, 1.4), new THREE.Vector3(x, y, 1.4)]
      const projected = corners.map(corner => corner.clone().applyMatrix4(group.matrixWorld).project(camera))
      const xs = projected.map(point => (point.x + 1) / 2 * layout.width)
      const ys = projected.map(point => (1 - point.y) / 2 * layout.height)
      const left = Math.min(...xs), top = Math.min(...ys), width = Math.max(...xs) - left, height = Math.max(...ys) - top
      const visible = center.z < -2 && left + width > 0 && left < layout.width && top + height > 0 && top < layout.height && width >= 44 && height >= 44
      button.style.visibility = visible ? 'visible' : 'hidden'
      button.style.zIndex = String(Math.max(0, 1000 + Math.round(center.z)))
      button.style.setProperty('--target-label-opacity', width > 130 ? '1' : '0')
      button.style.left = `${left}px`; button.style.top = `${top}px`; button.style.width = `${width}px`; button.style.height = `${height}px`
    })
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
  return { update, dispose }
}

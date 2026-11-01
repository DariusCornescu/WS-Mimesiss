import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// Generate the scene off the main thread; transfer buffers without copying them.
const shape = { x: 4.7, y: 3.5, z: 1.35 }
const locations = [new THREE.Vector3(-5, -.5, 0), new THREE.Vector3(7, 1.2, -28), new THREE.Vector3(-3, -.8, -58), new THREE.Vector3(5, .5, -90)]
function seededRandom(seed: number) {
  let state = seed >>> 0
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296 }
}

function taperedBranch(points: THREE.Vector3[], radius: number, segments: number, sides: number) {
  const curve = new THREE.CatmullRomCurve3(points)
  const geometry = new THREE.TubeGeometry(curve, segments, 1, sides, false)
  const positions = geometry.getAttribute('position')
  const point = new THREE.Vector3()
  for (let ring = 0; ring <= segments; ring++) {
    const t = ring / segments
    const center = curve.getPointAt(t)
    const thickness = .015 + radius * Math.pow(1 - t, .85)
    for (let side = 0; side <= sides; side++) {
      const index = ring * (sides + 1) + side
      point.fromBufferAttribute(positions, index).sub(center).multiplyScalar(thickness).add(center)
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

// A slightly wider shell around a branch carries the travelling signal; `value`
// is written per vertex so the shader can offset or route each branch.
function signalShell(points: THREE.Vector3[], radius: number, segments: number, attribute: string, value: number, sides = 4) {
  const geometry = taperedBranch(points, radius * 1.18 + .03, segments, sides)
  geometry.setAttribute(attribute, new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count).fill(value), 1))
  return geometry
}

function neurites(seed: number, count: number, detailed: boolean, shells?: THREE.BufferGeometry[]) {
  const random = seededRandom(seed)
  // Separate stream, so adding signals never changes the shape of a neuron.
  const phases = seededRandom(seed * 31 + 7)
  const geometries: THREE.BufferGeometry[] = []
  for (let branch = 0; branch < count; branch++) {
    const angle = branch / count * Math.PI * 2 + (random() - .5) * .28
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), (random() - .5) * .45)
    const root = new THREE.Vector3(direction.x * shape.x * .77, direction.y * shape.y * .77, -.3)
    const length = 7 + random() * 7
    const points = [root, root.clone().addScaledVector(direction, 2), root.clone().addScaledVector(direction, length * .55).add(new THREE.Vector3((random() - .5) * 3, (random() - .5) * 3, (random() - .5) * 5)), root.clone().addScaledVector(direction, length).add(new THREE.Vector3((random() - .5) * 4, (random() - .5) * 4, (random() - .5) * 8))]
    const radius = detailed ? .35 + random() * .15 : .22
    geometries.push(taperedBranch(points, radius, detailed ? 26 : 11, detailed ? 6 : 4))
    const shellPhase = phases()
    shells?.push(signalShell(points, radius, 20, 'phase', shellPhase))
    if (detailed) {
      for (let fork = 0; fork < 2; fork++) {
        const origin = points[2].clone()
        const forkAngle = angle + (fork === 0 ? -.55 : .6)
        const reach = 4 + random() * 4
        const end = origin.clone().add(new THREE.Vector3(Math.cos(forkAngle) * reach, Math.sin(forkAngle) * reach, (random() - .5) * 7))
        const middle = origin.clone().lerp(end, .5).add(new THREE.Vector3(0, (random() - .5) * 2, 1))
        geometries.push(taperedBranch([origin, middle, end], .11, 14, 4))
        // Fork shells carry the same impulse past the junction: phase + 10 marks them for the shader.
        shells?.push(signalShell([origin, middle, end], .11, 8, 'phase', 10 + shellPhase))
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


export type NeuralGeometryStage = 0 | 1 | 2 | 3 | 'background'

export function buildNeuralGeometryStage(stage: NeuralGeometryStage): Record<string, THREE.BufferGeometry> {
  if (typeof stage === 'number') {
    const shells: THREE.BufferGeometry[] = []
    const branches = neurites(300 + stage, 9, true, shells)
    const signals = mergeGeometries(shells)!
    shells.forEach(geometry => geometry.dispose())
    return {
      ...(stage === 0 ? { body: organicBody(44) } : {}),
      ['branches' + stage]: branches,
      ['signals' + stage]: signals,
      ['photo' + stage]: photographGeometry(stage),
    }
  }
  const meshes: Record<string, THREE.BufferGeometry> = {}
  const random = seededRandom(1862)
  const bodies = [], branches = []
  for (let i = 0; i < 22; i++) {
    const group = new THREE.Group()
    group.position.set((i % 2 ? -1 : 1) * (14 + random() * 15), (random() - .5) * 24, 8 - i * 6.8)
    group.rotation.set(random(), random(), random() * Math.PI)
    group.scale.setScalar(.55 + random() * .55)
    group.updateMatrix()
    bodies.push(organicBody(12).applyMatrix4(group.matrix))
    branches.push((neurites(800 + i, 6, false)).applyMatrix4(group.matrix))
  }
  meshes.backgroundBodies = mergeGeometries(bodies)
  meshes.backgroundBranches = mergeGeometries(branches)
  bodies.forEach(geometry => geometry.dispose())
  branches.forEach(geometry => geometry.dispose())
  const paths = locations.slice(1).map((location, i) => {
    const from = locations[i].clone().add(new THREE.Vector3(3.5, -2, -1))
    const to = location.clone().add(new THREE.Vector3(-3.5, -2, -1))
    const middle = from.clone().lerp(to, .5).add(new THREE.Vector3(7, -5, -3))
    return [from, middle, to]
  })
  const connections = paths.map(points => taperedBranch(points, .28, 36, 6))
  meshes.connections = mergeGeometries(connections)
  connections.forEach(geometry => geometry.dispose())
  // `segment` tells the shader which camera journey (neuron i to i + 1) a signal belongs to.
  const connectionSignals = paths.map((points, i) => signalShell(points, .28, 48, 'segment', i))
  meshes.connectionSignals = mergeGeometries(connectionSignals)
  connectionSignals.forEach(geometry => geometry.dispose())
  return meshes
}

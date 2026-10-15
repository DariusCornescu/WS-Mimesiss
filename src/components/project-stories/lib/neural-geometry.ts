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


export function buildNeuralGeometry() {
  const meshes: Record<string, THREE.BufferGeometry> = { body: organicBody(44) }
  for (let i = 0; i < 4; i++) {
    meshes['branches' + i] = neurites(300 + i, 9, true)
    meshes['photo' + i] = photographGeometry(i)
  }
  const random = seededRandom(1862)
  const bodies = [], branches = []
  for (let i = 0; i < 22; i++) {
    const group = new THREE.Group()
    group.position.set((i % 2 ? -1 : 1) * (14 + random() * 15), (random() - .5) * 24, 8 - i * 6.8)
    group.rotation.set(random(), random(), random() * Math.PI)
    group.scale.setScalar(.55 + random() * .55)
    group.updateMatrix()
    bodies.push(organicBody(16).applyMatrix4(group.matrix))
    branches.push((neurites(800 + i, 6, false)).applyMatrix4(group.matrix))
  }
  meshes.backgroundBodies = mergeGeometries(bodies)
  meshes.backgroundBranches = mergeGeometries(branches)
  const connections = locations.slice(1).map((location, i) => {
    const from = locations[i].clone().add(new THREE.Vector3(3.5, -2, -1))
    const to = location.clone().add(new THREE.Vector3(-3.5, -2, -1))
    const middle = from.clone().lerp(to, .5).add(new THREE.Vector3(7, -5, -3))
    return taperedBranch([from, middle, to], .28, 36, 6)
  })
  meshes.connections = mergeGeometries(connections)
  return meshes
}

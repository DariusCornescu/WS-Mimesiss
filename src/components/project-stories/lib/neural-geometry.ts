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
function signalShell(points: THREE.Vector3[], radius: number, segments: number, attribute: string, value: number) {
  const geometry = taperedBranch(points, radius * 1.18 + .03, segments, 5)
  geometry.setAttribute(attribute, new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count).fill(value), 1))
  return geometry
}

const scalarAttribute = (geometry: THREE.BufferGeometry, name: string, value: number) =>
  geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(geometry.getAttribute('position').count).fill(value), 1))

/** Point on a cell body's rim at `angle`, pushed out by `reach` (1 = on the membrane). */
function rimPoint(center: THREE.Vector3, angle: number, reach: number, z: number) {
  return center.clone().add(new THREE.Vector3(Math.cos(angle) * shape.x * reach, Math.sin(angle) * shape.y * reach, z))
}

/**
 * Where an axon reaches the next neuron it splits into a few terminal twigs,
 * each ending in a bouton on the membrane: the synapse. The shells carry
 * `uv.x` above 1 so the shader can tell a terminal from the axon itself and
 * light it when the impulse arrives.
 */
function synapse(from: THREE.Vector3, neuron: THREE.Vector3, angle: number, spread: number[], segment: number, bodies: THREE.BufferGeometry[], shells: THREE.BufferGeometry[]) {
  spread.forEach((offset, index) => {
    // Twigs bow outwards and land just outside the membrane, clear of the photograph.
    const end = rimPoint(neuron, angle + offset, 1.1, .1 - Math.abs(offset) * .5)
    const outward = new THREE.Vector3(Math.cos(angle + offset) * shape.x, Math.sin(angle + offset) * shape.y, 0).normalize()
    const middle = from.clone().lerp(end, .55).addScaledVector(outward, .3).add(new THREE.Vector3(0, index * .06, 0))
    const points = [from, middle, end]
    bodies.push(taperedBranch(points, .1, 10, 4))
    const bouton = new THREE.SphereGeometry(.19, 8, 6).translate(end.x, end.y, end.z)
    bodies.push(bouton)
    const twig = signalShell(points, .1, 10, 'segment', segment)
    const twigUv = twig.getAttribute('uv')
    for (let i = 0; i < twigUv.count; i++) twigUv.setX(i, 1 + .06 * twigUv.getX(i))
    const glow = new THREE.SphereGeometry(.3, 8, 6).translate(end.x, end.y, end.z)
    const glowUv = glow.getAttribute('uv')
    for (let i = 0; i < glowUv.count; i++) glowUv.setX(i, 1.08)
    scalarAttribute(glow, 'segment', segment)
    shells.push(twig, glow)
  })
}

/** A unit vector at right angles to `along`, picked from the `random` stream. */
function sideways(along: THREE.Vector3, random: () => number) {
  const pick = new THREE.Vector3(random() - .5, random() - .5, random() - .5)
  return pick.addScaledVector(along, -pick.dot(along)).normalize()
}

/**
 * What makes a dendrite read as one: it keeps dividing into finer and finer
 * twigs, and its surface is studded with spines. `points` is an existing
 * branch; everything here is added to it and drawn from its own random
 * stream, so the trunks and forks stay exactly where they were.
 */
function arbor(points: THREE.Vector3[], radius: number, levels: number, spines: number, random: () => number, out: THREE.BufferGeometry[]) {
  const curve = new THREE.CatmullRomCurve3(points)
  const length = curve.getLength()
  for (let i = 0; i < spines; i++) {
    const t = .12 + .8 * (i + random()) / spines
    const along = curve.getTangentAt(t)
    const out3 = sideways(along, random)
    const skin = .015 + radius * Math.pow(1 - t, .85)
    const base = curve.getPointAt(t).addScaledVector(out3, skin * .7)
    out.push(taperedBranch([base, base.clone().addScaledVector(out3, .16 + random() * .2).addScaledVector(along, .05)], .045, 2, 3))
  }
  if (levels <= 0) return
  for (const t of [.34 + random() * .12, .74 + random() * .14]) {
    const along = curve.getTangentAt(t)
    const direction = along.clone().multiplyScalar(.75).add(sideways(along, random)).normalize()
    const origin = curve.getPointAt(t)
    const reach = length * (.28 + random() * .18)
    const middle = origin.clone().addScaledVector(direction, reach * .5).add(new THREE.Vector3((random() - .5) * .8, (random() - .5) * .8, (random() - .5) * 1.4))
    const end = origin.clone().addScaledVector(direction, reach).add(new THREE.Vector3((random() - .5) * 1.4, (random() - .5) * 1.4, (random() - .5) * 2.4))
    const twig = [origin, middle, end]
    const girth = Math.max(.04, radius * .32 * (1 - t * .5))
    out.push(taperedBranch(twig, girth, levels > 1 ? 12 : 8, levels > 1 ? 4 : 3))
    arbor(twig, girth, levels - 1, levels > 1 ? 4 : 0, random, out)
  }
}

function neurites(seed: number, count: number, detailed: boolean, shells?: THREE.BufferGeometry[]) {
  const random = seededRandom(seed)
  // Separate stream for the fine detail, so it never moves a trunk or a fork.
  const fine = seededRandom(seed * 17 + 3)
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
    geometries.push(taperedBranch(points, radius, detailed ? 26 : 16, detailed ? 6 : 4))
    shells?.push(signalShell(points, radius, 26, 'phase', phases()))
    arbor(points, radius, detailed ? 2 : 1, detailed ? 12 : 0, fine, geometries)
    if (detailed) {
      for (let fork = 0; fork < 2; fork++) {
        const origin = points[2].clone()
        const forkAngle = angle + (fork === 0 ? -.55 : .6)
        const reach = 4 + random() * 4
        const end = origin.clone().add(new THREE.Vector3(Math.cos(forkAngle) * reach, Math.sin(forkAngle) * reach, (random() - .5) * 7))
        const middle = origin.clone().lerp(end, .5).add(new THREE.Vector3(0, (random() - .5) * 2, 1))
        geometries.push(taperedBranch([origin, middle, end], .11, 14, 4))
        arbor([origin, middle, end], .11, 1, 5, fine, geometries)
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
  const centres: THREE.Vector3[] = []
  for (let i = 0; i < 22; i++) {
    const group = new THREE.Group()
    group.position.set((i % 2 ? -1 : 1) * (14 + random() * 15), (random() - .5) * 24, 8 - i * 6.8)
    centres.push(group.position.clone())
    group.rotation.set(random(), random(), random() * Math.PI)
    group.scale.setScalar(.55 + random() * .55)
    group.updateMatrix()
    bodies.push(organicBody(16).applyMatrix4(group.matrix))
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
  // `segment` tells the shader which camera journey (neuron i to i + 1) a signal belongs to.
  const connectionSignals = paths.map((points, i) => signalShell(points, .28, 48, 'segment', i))
  // Each journey ends in a synapse on the neuron it reaches.
  paths.forEach((points, i) => {
    // The axon runs under the cell body; a short stem brings it out beside the
    // membrane, so the terminals fan out next to the photograph, not across it.
    const angle = Math.atan2(-2, -3.5)
    const tip = new THREE.CatmullRomCurve3(points).getPointAt(.9)
    const root = rimPoint(locations[i + 1], angle, 1.55, -.6)
    const stem = [tip, tip.clone().lerp(root, .5).add(new THREE.Vector3(-.3, -.5, -.2)), root]
    connections.push(taperedBranch(stem, .2, 10, 5))
    const stemSignal = signalShell(stem, .2, 10, 'segment', i)
    const stemUv = stemSignal.getAttribute('uv')
    for (let v = 0; v < stemUv.count; v++) stemUv.setX(v, .95 + .05 * stemUv.getX(v))
    connectionSignals.push(stemSignal)
    synapse(root, locations[i + 1], angle, [-.5, -.25, 0, .25, .5], i, connections, connectionSignals)
  })
  // The wider network: thin axons between the distant neurons, and from the
  // nearest ones into each neuron the camera visits. A separate random stream
  // keeps the existing cell shapes exactly as they were. Segments from 3 up
  // loop on their own instead of following the camera.
  const wiring = seededRandom(4242)
  let link = 3
  const wire = (from: THREE.Vector3, to: THREE.Vector3, sag: number) => {
    const middle = from.clone().lerp(to, .5).add(new THREE.Vector3((wiring() - .5) * 4, -sag + (wiring() - .5) * 3, (wiring() - .5) * 4))
    const points = [from, middle, to]
    connections.push(taperedBranch(points, .1, 24, 4))
    connectionSignals.push(signalShell(points, .1, 24, 'segment', link))
    return points
  }
  for (let i = 0; i + 2 < centres.length; i++) { wire(centres[i], centres[i + 2], 2); link++ }
  // The first neuron is left alone: it is what the opening still frame shows.
  locations.slice(1).forEach(neuron => {
    for (const side of [1, -1]) {
      const nearest = centres.filter(centre => Math.sign(centre.x) === side).sort((a, b) => a.distanceTo(neuron) - b.distanceTo(neuron))[0]
      // Wide screens put the copy to the right of the photograph: land below it.
      const angle = side === 1 ? -1.05 : Math.PI - .55
      const approach = rimPoint(neuron, angle, 1.7, -.6)
      wire(nearest, approach, 3)
      synapse(approach, neuron, angle, [-.22, 0, .22], link, connections, connectionSignals)
      link++
    }
  })
  meshes.connections = mergeGeometries(connections)
  connections.forEach(geometry => geometry.dispose())
  meshes.connectionSignals = mergeGeometries(connectionSignals)
  connectionSignals.forEach(geometry => geometry.dispose())
  return meshes
}

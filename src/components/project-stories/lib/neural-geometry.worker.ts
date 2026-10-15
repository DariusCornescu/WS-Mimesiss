import { buildNeuralGeometry } from './neural-geometry'

self.onmessage = async () => {
  try {
    const geometries = await buildNeuralGeometry()
    const entries = Object.entries(geometries).map(([name, geometry]) => [name, {
      attributes: Object.fromEntries(Object.entries(geometry.attributes).map(([key, attribute]) => [key, { array: attribute.array, itemSize: attribute.itemSize }])),
      index: geometry.index?.array,
    }])
    const buffers = Object.values(geometries).flatMap(geometry => [...Object.values(geometry.attributes).map(attribute => attribute.array.buffer), ...(geometry.index ? [geometry.index.array.buffer] : [])])
    self.postMessage({ geometries: entries }, { transfer: [...new Set(buffers)] })
  } catch {
    self.postMessage({ error: 'Scene geometry could not be prepared.' })
  }
}

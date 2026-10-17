import { buildNeuralGeometryStage, type NeuralGeometryStage } from './neural-geometry'

self.onmessage = (event: MessageEvent<NeuralGeometryStage>) => {
  try {
    const geometries = buildNeuralGeometryStage(event.data)
    const entries = Object.entries(geometries).map(([name, geometry]) => {
      geometry.computeBoundingSphere()
      return [name, {
      attributes: Object.fromEntries(Object.entries(geometry.attributes).map(([key, attribute]) => [key, { array: attribute.array, itemSize: attribute.itemSize }])),
      index: geometry.index?.array,
      sphere: { center: geometry.boundingSphere!.center.toArray(), radius: geometry.boundingSphere!.radius },
    }] })
    const buffers = Object.values(geometries).flatMap(geometry => [...Object.values(geometry.attributes).map(attribute => attribute.array.buffer), ...(geometry.index ? [geometry.index.array.buffer] : [])])
    self.postMessage({ stage: event.data, geometries: entries }, { transfer: [...new Set(buffers)] })
  } catch {
    self.postMessage({ stage: event.data, error: 'Scene geometry could not be prepared.' })
  }
}

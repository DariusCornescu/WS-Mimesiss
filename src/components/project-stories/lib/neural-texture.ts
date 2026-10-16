import * as THREE from 'three'

const cancelled = () => new DOMException('Scene loading cancelled', 'AbortError')

async function imageElement(blob: Blob, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(blob)
    const finish = () => { image.onload = null; image.onerror = null; signal.removeEventListener('abort', abort); URL.revokeObjectURL(url) }
    const abort = () => { finish(); image.src = ''; reject(cancelled()) }
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true })
    image.onload = () => { finish(); resolve(image) }
    image.onerror = () => { finish(); reject(new Error('Scene image could not be decoded.')) }
    image.decoding = 'async'
    image.src = url
  })
}

export async function loadNeuralTexture(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Scene image could not be loaded.')
  const blob = await response.blob()
  if (signal.aborted) throw cancelled()
  let bitmap: ImageBitmap | null = null
  if (typeof createImageBitmap === 'function') {
    try { bitmap = await createImageBitmap(blob, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }) }
    catch { if (signal.aborted) throw cancelled() }
  }
  if (signal.aborted) { bitmap?.close(); throw cancelled() }
  const texture = new THREE.Texture(bitmap ?? await imageElement(blob, signal))
  texture.flipY = !bitmap
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  if (bitmap) {
    const image = bitmap
    let closed = false
    texture.addEventListener('dispose', () => { if (!closed) { closed = true; image.close() } })
  }
  if (signal.aborted) { texture.dispose(); throw cancelled() }
  return texture
}

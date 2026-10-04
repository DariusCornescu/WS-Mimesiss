'use client'

const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024

/** Optimize large camera photos before they reach the serverless request limit. */
export async function prepareMediaUpload(file: File): Promise<Blob> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Alege o fotografie JPG, PNG sau WebP.')
  }
  if (file.size > MAX_ORIGINAL_BYTES) throw new Error('Fotografia trebuie să aibă cel mult 25 MB.')
  if (!file.size) throw new Error('Fișierul este gol.')
  if (file.size <= MAX_UPLOAD_BYTES) return file

  let source: ImageBitmap | HTMLImageElement
  let localUrl: string | undefined
  try {
    if (typeof createImageBitmap === 'function') {
      source = await createImageBitmap(file)
    } else {
      localUrl = URL.createObjectURL(file)
      const image = new Image()
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('Fotografia nu a putut fi citită.'))
        image.src = localUrl!
      })
    }
  } catch {
    if (localUrl) URL.revokeObjectURL(localUrl)
    throw new Error('Fotografia nu a putut fi citită. Alege un alt fișier.')
  }

  try {
    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height
    if (!width || !height || width * height > 40_000_000) {
      throw new Error('Rezoluția este prea mare. Alege o fotografie de maximum 40 megapixeli.')
    }
    const scale = Math.min(1, 1800 / Math.max(width, height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Optimizarea fotografiei nu este disponibilă în acest browser.')
    context.drawImage(source, 0, 0, canvas.width, canvas.height)
    const output = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Fotografia nu a putut fi optimizată.')), 'image/webp', 0.85)
    })
    if (output.size > MAX_UPLOAD_BYTES) throw new Error('Fotografia este încă prea mare după optimizare. Alege o versiune mai mică.')
    return output
  } finally {
    if ('close' in source) source.close()
    if (localUrl) URL.revokeObjectURL(localUrl)
  }
}

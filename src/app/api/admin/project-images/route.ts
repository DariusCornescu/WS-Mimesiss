import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { requireRole, toAuthResponse } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { limitRequests, requireSameOrigin, RequestError, requestErrorResponse } from '@/lib/request-security'
import { ProjectImage } from '@/models/ProjectImage'


export const runtime = 'nodejs'
const MAX_SIZE = 3 * 1024 * 1024

function imageName(header: string | null): string {
  let value = header || ''
  try { value = decodeURIComponent(value) } catch { value = '' }
  return value.split(/[/\\]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 140) || 'Fotografie'
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const user = await requireRole('admin')
    await limitRequests(user.clerkId, 'project-image', 120, 600)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(request.headers.get('content-type') || '')) {
      throw new RequestError(415, 'Alege o imagine JPG, PNG sau WebP.')
    }
    const reader = request.body?.getReader()
    if (!reader) throw new RequestError(400, 'Imaginea lipsește.')
    const chunks: Uint8Array[] = []
    let size = 0
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > MAX_SIZE) {
          await reader.cancel()
          throw new RequestError(413, 'Imaginea trebuie să aibă cel mult 3 MB.')
        }
        chunks.push(value)
      }
    } finally { reader.releaseLock() }
    let data: Buffer
    try {
      const input = Buffer.concat(chunks)
      const metadata = await sharp(input, { limitInputPixels: 40_000_000 }).metadata()
      if (!['jpeg', 'png', 'webp'].includes(metadata.format || '') || (metadata.pages || 1) > 1) throw new Error('format')
      data = await sharp(input, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 85 }).toBuffer()
    } catch {
      throw new RequestError(400, 'Imagine invalidă. Alege o fotografie JPG, PNG sau WebP fără animație.')
    }
    await connectDB()
    const sha256 = createHash('sha256').update(data).digest('hex')
    let image: { _id: { toString(): string } } | null
    try {
      image = await ProjectImage.create({ data, contentType: 'image/webp', createdBy: user.clerkId, name: imageName(request.headers.get('x-file-name')), sha256 })
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error
      image = await ProjectImage.findOne({ sha256 }).select('_id').lean() as { _id: { toString(): string } } | null
      if (!image) throw error
    }
    if (!image) throw new Error('Image creation returned no record')
    return Response.json({ url: `/api/project-images/${image._id}` }, { status: 201 })
  } catch (error) {
    const response = toAuthResponse(error) || requestErrorResponse(error)
    if (response) return response
    console.error('Project image upload failed', error)
    return Response.json({ error: 'Imaginea nu a putut fi încărcată. Încearcă din nou.' }, { status: 500 })
  }
}

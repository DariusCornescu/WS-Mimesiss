import { isValidObjectId } from 'mongoose'
import connectDB from '@/lib/mongodb'
import { ProjectImage } from '@/models/ProjectImage'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isValidObjectId(id)) return new Response(null, { status: 404 })
  try {
    await connectDB()
    const image = await ProjectImage.findById(id)
    if (!image) return new Response(null, { status: 404 })
    return new Response(new Uint8Array(image.data), {
      headers: { 'Content-Type': image.contentType, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch (error) {
    console.error('Project image read failed', error)
    return new Response(null, { status: 503 })
  }
}

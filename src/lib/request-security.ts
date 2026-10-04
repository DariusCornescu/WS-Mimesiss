import { createHash } from 'node:crypto'
import mongoose, { Schema } from 'mongoose'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export class RequestError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message) }
}
const schema = new Schema({ _id: String, count: Number, expiresAt: Date })
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
const RequestBucket = mongoose.models.RequestBucket || mongoose.model('RequestBucket', schema)

// Shared database counter: limits work across all serverless instances.
export async function limitRequests(subject: string, action: string, max = 10, seconds = 60) {
  await connectDB()
  const window = Math.floor(Date.now() / (seconds * 1000))
  const key = createHash('sha256').update(action + ':' + subject + ':' + window).digest('hex')
  let counter: { count?: number } | null
  try {
    counter = await RequestBucket.findOneAndUpdate({ _id: key }, {
      $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 2) * seconds * 1000) },
    }, { new: true, upsert: true }).lean() as { count?: number } | null
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error
    counter = await RequestBucket.findOneAndUpdate({ _id: key }, { $inc: { count: 1 } }, { new: true }).lean() as { count?: number } | null
  }
  if (!counter || Number(counter.count) > max) throw new RequestError(429, 'Prea multe încercări. Așteaptă un minut și încearcă din nou.')
}
export function requireSameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new RequestError(403, 'Cerere nepermisă.')
}
export async function readSmallJson(request: Request, maximum = 8192): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new RequestError(415, 'Format invalid.')
  const reader = request.body?.getReader()
  if (!reader) throw new RequestError(400, 'Date invalide.')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maximum) { await reader.cancel(); throw new RequestError(413, 'Cererea este prea mare.') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw new RequestError(400, 'Date invalide.') }
}
export function requestErrorResponse(error: unknown) {
  if (!(error instanceof RequestError)) return null
  return NextResponse.json({ error: error.message, code: error.code }, {
    status: error.status, headers: error.status === 429 ? { 'Retry-After': '60' } : undefined,
  })
}

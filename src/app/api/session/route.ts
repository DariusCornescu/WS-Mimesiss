import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { userId } = await auth()
  return NextResponse.json({ signedIn: Boolean(userId) }, {
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' },
  })
}

import { revalidatePath } from 'next/cache'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { createAlbum, getAdminAlbums } from '@/lib/gallery'
import { limitRequests, readSmallJson, requireSameOrigin, requestErrorResponse } from '@/lib/request-security'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await requireRole('admin')
    return Response.json({ albums: await getAdminAlbums() }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    const response = toAuthResponse(error) || requestErrorResponse(error)
    if (response) return response
    console.error('Gallery albums read failed', error)
    return Response.json({ error: 'Albumele nu au putut fi încărcate. Încearcă din nou.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const user = await requireRole('admin')
    await limitRequests(user.clerkId, 'gallery-write', 60, 600)
    const album = await createAlbum(await readSmallJson(request, 200_000), user.clerkId)
    revalidatePath('/congres/gallery')
    return Response.json({ album }, { status: 201 })
  } catch (error) {
    const response = toAuthResponse(error) || requestErrorResponse(error)
    if (response) return response
    console.error('Gallery album create failed', error)
    return Response.json({ error: 'Albumul nu a putut fi creat. Încearcă din nou.' }, { status: 500 })
  }
}

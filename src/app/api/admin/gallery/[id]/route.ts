import { revalidatePath } from 'next/cache'
import { requireRole, toAuthResponse } from '@/lib/auth'
import { getAdminAlbum, removeAlbum, updateAlbum } from '@/lib/gallery'
import { limitRequests, readSmallJson, requireSameOrigin, RequestError, requestErrorResponse } from '@/lib/request-security'

export const runtime = 'nodejs'
type Context = { params: Promise<{ id: string }> }

function invalidate(id: string) {
  revalidatePath('/congres/gallery')
  revalidatePath('/congres/gallery/[id]', 'page')
  revalidatePath(`/congres/gallery/${id}`)
}

function errorResponse(error: unknown, message: string) {
  const response = toAuthResponse(error) || requestErrorResponse(error)
  if (response) return response
  console.error('Gallery album request failed', error)
  return Response.json({ error: message }, { status: 500 })
}

export async function GET(_request: Request, context: Context) {
  try {
    await requireRole('admin')
    const album = await getAdminAlbum((await context.params).id)
    if (!album) throw new RequestError(404, 'Albumul nu mai există.')
    return Response.json({ album }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) { return errorResponse(error, 'Albumul nu a putut fi încărcat. Încearcă din nou.') }
}

export async function PUT(request: Request, context: Context) {
  try {
    requireSameOrigin(request)
    const user = await requireRole('admin')
    await limitRequests(user.clerkId, 'gallery-write', 60, 600)
    const { id } = await context.params
    const album = await updateAlbum(id, await readSmallJson(request, 200_000), user.clerkId)
    invalidate(album.id)
    return Response.json({ album })
  } catch (error) { return errorResponse(error, 'Albumul nu a putut fi salvat. Încearcă din nou.') }
}

export async function DELETE(request: Request, context: Context) {
  try {
    requireSameOrigin(request)
    const user = await requireRole('admin')
    await limitRequests(user.clerkId, 'gallery-write', 60, 600)
    const { id } = await context.params
    await removeAlbum(id, user.clerkId)
    invalidate(id)
    return Response.json({ success: true })
  } catch (error) { return errorResponse(error, 'Albumul nu a putut fi eliminat. Încearcă din nou.') }
}

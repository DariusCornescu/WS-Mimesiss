import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole, toAuthResponse } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { limitRequests, readSmallJson, requireSameOrigin, RequestError, requestErrorResponse } from '@/lib/request-security'
import { PartnerModel } from '@/models/Partner'
import { ProjectImage } from '@/models/ProjectImage'

export const runtime = 'nodejs'
const idSchema = z.string().regex(/^[a-f\d]{24}$/i)
const partnerSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().max(160).default(''),
  logo: z.string().regex(/^\/api\/project-images\/[a-f\d]{24}$/i),
  category: z.enum(['institutional', 'sponsor']),
  visible: z.boolean().default(false),
  order: z.number().int().min(0).max(9999).default(0),
}).strict()

async function mutate(request: Request, method: 'POST' | 'PATCH' | 'DELETE') {
  try {
    requireSameOrigin(request)
    const user = await requireRole('admin')
    await limitRequests(user.clerkId, 'partner-write', 60, 600)
    const input = await readSmallJson(request)
    await connectDB()
    if (method === 'DELETE') {
      const parsed = z.object({ id: idSchema }).strict().safeParse(input)
      if (!parsed.success) throw new RequestError(400, 'Partener invalid.')
      const deleted = await PartnerModel.findByIdAndDelete(parsed.data.id)
      if (!deleted) throw new RequestError(404, 'Partenerul nu mai există.')
      revalidatePath('/')
      revalidatePath('/admin/parteneri')
      return Response.json({ success: true })
    }
    const parsed = partnerSchema.safeParse(input)
    if (!parsed.success) throw new RequestError(400, 'Verifică numele, categoria, logo-ul și ordinea de afișare.')
    const { id, ...values } = parsed.data
    if (method === 'PATCH' && !id) throw new RequestError(400, 'Partener invalid.')
    if (method === 'POST' && id) throw new RequestError(400, 'Partener invalid.')
    const imageId = values.logo.split('/').pop()
    if (!await ProjectImage.exists({ _id: imageId })) throw new RequestError(400, 'Logo-ul nu există. Încarcă imaginea din nou.')
    const record = method === 'POST'
      ? await PartnerModel.create(values)
      : await PartnerModel.findByIdAndUpdate(id, { $set: values }, { new: true, runValidators: true })
    if (!record) throw new RequestError(404, 'Partenerul nu mai există.')
    revalidatePath('/')
    revalidatePath('/admin/parteneri')
    return Response.json({ partner: { id: String(record._id), ...values } }, { status: method === 'POST' ? 201 : 200 })
  } catch (error) {
    const response = toAuthResponse(error) || requestErrorResponse(error)
    if (response) return response
    console.error('Partner update failed', error)
    return Response.json({ error: 'Modificarea nu a putut fi salvată. Încearcă din nou.' }, { status: 500 })
  }
}

export async function POST(request: Request) { return mutate(request, 'POST') }
export async function PATCH(request: Request) { return mutate(request, 'PATCH') }
export async function DELETE(request: Request) { return mutate(request, 'DELETE') }

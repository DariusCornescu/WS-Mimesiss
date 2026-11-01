'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import connectDB from '@/lib/mongodb'
import { requireRole } from '@/lib/auth'
import { Project } from '@/models'
import type { ProjectDoc } from '@/lib/projects'
import { AuthError } from '@/lib/auth'
import { isValidObjectId } from 'mongoose'

export type AdminProject = ProjectDoc & { _id: string }

/** Aceeași poartă ca în restul adminului: rolul se verifică server-side, mereu. */
async function requireAdmin() {
  await requireRole('admin')
  await connectDB()
}

/** Slug URL-safe: fără diacritice, spații sau semne. */
function slugify(input: string) {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ăâîșşțţ]/gi, (c) => ({ ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't' }[c.toLowerCase()] || c))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function readForm(formData: FormData) {
  const text = (key: string, max: number) => {
    const value = formData.get(key)
    if (value !== null && typeof value !== 'string') throw new Error('Date invalide')
    if ((value?.length || 0) > max) throw new Error(`Câmpul ${key} este prea lung (maximum ${max} caractere).`)
    return value?.trim() || ''
  }
  const title = text('title', 160)
  const summary = text('summary', 400)

  if (!title) throw new Error('Titlul este obligatoriu')
  if (!summary) throw new Error('Descrierea scurtă este obligatorie')

  const rawSlug = text('slug', 180)
  const slug = slugify(rawSlug || title)
  if (!slug) throw new Error('Slug-ul rezultat este gol — schimbă titlul sau completează slug-ul')

  const orderRaw = text('order', 10)
  const order = Number(orderRaw)
  const coverImage = text('coverImage', 500)
  if (coverImage && !/^\/(?!\/)[a-zA-Z0-9/_.,%() -]+$/.test(coverImage)) throw new Error('Imaginea trebuie să fie încărcată sau să aibă o cale locală validă.')
  const kind = text('kind', 20)
  if (!['standard', 'congress', 'announcement'].includes(kind)) throw new Error('Tip invalid.')
  const status = text('status', 20)
  if (!['draft', 'published'].includes(status)) throw new Error('Stare invalidă.')
  if (status === 'published' && !coverImage) throw new Error('Adaugă o imagine înainte de publicare.')
  const focalPosition = (key: string) => {
    const raw = text(key, 10)
    const value = raw ? Number(raw) : 50
    if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error('Încadrarea fotografiei trebuie să fie între 0 și 100.')
    return value
  }

  return {
    slug,
    title,
    kicker: text('kicker', 60),
    summary,
    description: text('description', 20000),
    coverImage,
    coverPositionX: focalPosition('coverPositionX'),
    coverPositionY: focalPosition('coverPositionY'),
    order: Number.isFinite(order) ? order : 0,
    status,
    kind,
  }
}

/** Paginile publice care afișează proiecte. */
function revalidateProjectPages(slug?: string) {
  revalidatePath('/')
  revalidatePath('/proiecte')
  revalidatePath('/admin/proiecte')
  if (slug) revalidatePath(`/proiecte/${slug}`)
}

export async function getAllProjects(): Promise<AdminProject[]> {
  await requireAdmin()

  const docs = await Project.find({}).sort({ order: 1, createdAt: 1 }).lean<ProjectDoc[]>()
  // _id vine ca ObjectId; îl serializăm ca să poată trece spre componente.
  return docs.map((doc) => ({ ...doc, _id: String((doc as ProjectDoc & { _id: unknown })._id) }))
}

export async function getProjectById(id: string): Promise<AdminProject | null> {
  await requireAdmin()
  if (!isValidObjectId(id)) return null

  const doc = await Project.findById(id).lean<ProjectDoc>()
  if (!doc) return null
  return { ...doc, _id: String((doc as ProjectDoc & { _id: unknown })._id) }
}

export type ProjectFormState = { error?: string }

function savedProjectRedirect(formData: FormData): never {
  const key = formData.get('recoveryKey')
  const token = formData.get('recoveryToken')
  if (typeof key === 'string' && /^(new|[a-f0-9]{24})$/.test(key) && typeof token === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(token)) {
    redirect(`/admin/proiecte?savedDraft=${encodeURIComponent(key)}&savedToken=${encodeURIComponent(token)}`)
  }
  redirect('/admin/proiecte')
}

function saveError(error: unknown): ProjectFormState {
  if (error instanceof AuthError) return { error: error.message }
  if ((error as { code?: number })?.code === 11000) return { error: 'Această adresă este deja folosită. Schimbă titlul sau adresa din opțiunile avansate.' }
  console.error('Project save failed', error)
  return { error: error instanceof Error && !error.name.includes('Mongo') ? error.message : 'Postarea nu a putut fi salvată. Încearcă din nou.' }
}

export async function createProject(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  try {
    await requireAdmin()
    const data = readForm(formData)
    if (await Project.findOne({ slug: data.slug })) throw new Error('Această adresă este deja folosită. Schimbă titlul sau adresa din opțiunile avansate.')
    await Project.create(data)
    revalidateProjectPages(data.slug)
  } catch (error) { return saveError(error) }
  savedProjectRedirect(formData)
}

export async function updateProject(id: string, _state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  try {
  await requireAdmin()
  if (!isValidObjectId(id)) throw new Error('Postare negăsită.')
  const previous = await Project.findById(id).lean<ProjectDoc>()
  if (!previous) throw new Error('Postare negăsită.')
  const data = readForm(formData)
  if (previous.kind === 'congress' && data.kind !== 'congress') throw new Error('Tipul proiectului congres nu poate fi schimbat.')

  const clash = await Project.findOne({ slug: data.slug, _id: { $ne: id } })
  if (clash) {
    throw new Error(`Există deja un alt proiect cu slug-ul „${data.slug}"`)
  }

  const updated = await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!updated) throw new Error('Proiectul nu a fost găsit')

  revalidateProjectPages(data.slug)
  revalidatePath(`/admin/proiecte/edit/${id}`)
  if (previous.slug !== data.slug) revalidateProjectPages(previous.slug)
  } catch (error) { return saveError(error) }
  savedProjectRedirect(formData)
}

export async function duplicateProject(id: string): Promise<ProjectFormState> {
  let copyId = ''
  try {
    await requireAdmin()
    if (!isValidObjectId(id)) throw new Error('Postare negăsită.')
    const source = await Project.findById(id).lean<ProjectDoc>()
    if (!source) throw new Error('Postare negăsită.')
    if (source.kind === 'congress') throw new Error('Proiectul congres este protejat și nu poate fi duplicat.')
    const baseSlug = `${source.slug.slice(0, 160)}-copie`
    for (let attempt = 1; attempt <= 30; attempt++) {
      const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`
      if (await Project.findOne({ slug })) continue
      try {
        const copy = await Project.create({
          slug, title: source.title, kicker: source.kicker, summary: source.summary,
          description: source.description, coverImage: source.coverImage,
          coverPositionX: source.coverPositionX ?? 50, coverPositionY: source.coverPositionY ?? 50,
          order: source.order, kind: source.kind, status: 'draft',
        })
        copyId = String(copy._id)
        break
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000) throw error
      }
    }
    if (!copyId) throw new Error('Copia nu a putut fi creată. Încearcă din nou.')
    revalidatePath('/admin/proiecte')
  } catch (error) { return saveError(error) }
  redirect(`/admin/proiecte/edit/${copyId}`)
}

export async function deleteProject(formData: FormData) {
  await requireAdmin()

  const id = formData.get('id') as string
  if (!id) throw new Error('Lipsește id-ul proiectului')

  const doc = await Project.findById(id).lean<ProjectDoc>()
  if (!doc) throw new Error('Proiectul nu a fost găsit')

  // Congresul are ediții și workshopuri legate de el; ștergerea l-ar orfaniza.
  if (doc.kind === 'congress') {
    throw new Error('Proiectul congres nu poate fi șters — are ediții și workshopuri legate de el')
  }

  await Project.findByIdAndDelete(id)
  revalidateProjectPages(doc.slug)
}

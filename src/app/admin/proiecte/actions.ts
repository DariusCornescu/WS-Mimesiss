'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import connectDB from '@/lib/mongodb'
import { requireRole } from '@/lib/auth'
import { Project } from '@/models'
import type { ProjectDoc } from '@/lib/projects'

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
  const title = (formData.get('title') as string)?.trim()
  const summary = (formData.get('summary') as string)?.trim()

  if (!title) throw new Error('Titlul este obligatoriu')
  if (!summary) throw new Error('Descrierea scurtă este obligatorie')

  const rawSlug = (formData.get('slug') as string)?.trim()
  const slug = slugify(rawSlug || title)
  if (!slug) throw new Error('Slug-ul rezultat este gol — schimbă titlul sau completează slug-ul')

  const orderRaw = (formData.get('order') as string)?.trim()
  const order = Number(orderRaw)

  return {
    slug,
    title,
    kicker: (formData.get('kicker') as string)?.trim() || undefined,
    summary,
    description: (formData.get('description') as string)?.trim() || undefined,
    coverImage: (formData.get('coverImage') as string)?.trim() || undefined,
    order: Number.isFinite(order) ? order : 0,
    status: (formData.get('status') as string) === 'published' ? 'published' : 'draft',
    kind: (formData.get('kind') as string) === 'congress' ? 'congress' : 'standard',
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

  const doc = await Project.findById(id).lean<ProjectDoc>()
  if (!doc) return null
  return { ...doc, _id: String((doc as ProjectDoc & { _id: unknown })._id) }
}

export async function createProject(formData: FormData) {
  await requireAdmin()
  const data = readForm(formData)

  if (await Project.findOne({ slug: data.slug })) {
    throw new Error(`Există deja un proiect cu slug-ul „${data.slug}"`)
  }

  await Project.create(data)
  revalidateProjectPages(data.slug)
  redirect('/admin/proiecte')
}

export async function updateProject(id: string, formData: FormData) {
  await requireAdmin()
  const data = readForm(formData)

  const clash = await Project.findOne({ slug: data.slug, _id: { $ne: id } })
  if (clash) {
    throw new Error(`Există deja un alt proiect cu slug-ul „${data.slug}"`)
  }

  const updated = await Project.findByIdAndUpdate(id, data, { new: true, runValidators: true })
  if (!updated) throw new Error('Proiectul nu a fost găsit')

  revalidateProjectPages(data.slug)
  redirect('/admin/proiecte')
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

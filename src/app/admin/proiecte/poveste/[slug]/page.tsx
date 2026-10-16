import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRoleOrRedirect } from '@/lib/auth'
import { isEditableStorySlug } from '@/lib/project-story-copy'
import { readProjectStoryCopy } from '@/lib/editable-project-content'
import ProjectStoryForm from '@/components/admin/ProjectStoryForm'

export default async function ProjectStoryEditor({ params }: { params: Promise<{ slug: string }> }) {
  await requireRoleOrRedirect('admin')
  const { slug } = await params
  if (!isEditableStorySlug(slug)) notFound()
  const copy = await readProjectStoryCopy(slug)
  return <div className="max-w-4xl space-y-6"><Link href="/admin/proiecte" className="text-sm text-primary">Înapoi la proiecte</Link><h1 className="text-3xl font-bold">Texte pentru {slug === 'mimesiss' ? 'MIMESISS' : 'Balul bobocilor'}</h1><ProjectStoryForm slug={slug} initialCopy={copy} /></div>
}

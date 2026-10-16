import Link from 'next/link'
import { requireRoleOrRedirect } from '@/lib/auth'
import { readTentStoryCopy } from '@/lib/project-story-content'
import TentStoryForm from '@/components/admin/TentStoryForm'

export default async function TentStoryEditor() {
  await requireRoleOrRedirect('admin')
  const copy = await readTentStoryCopy()
  return <div className="max-w-4xl space-y-6">
    <Link href="/admin/proiecte" className="text-sm text-primary">Înapoi la proiecte</Link>
    <div><h1 className="text-3xl font-bold">Texte pentru Cortul IMM</h1><p className="mt-2 text-muted-foreground">Povestea animată · Cele trei imagini de album</p></div>
    <TentStoryForm initialCopy={copy} />
  </div>
}

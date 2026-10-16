'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { saveProjectStoryCopy } from '@/app/admin/proiecte/poveste/actions'
import { tentCopyLimits } from '@/lib/tent-story-copy'
import type { EditableStorySlug, ProjectStoryCopy } from '@/lib/project-story-copy'
import { storyEditorScenes } from '@/lib/project-story-defaults'

export default function ProjectStoryForm({ slug, initialCopy }: { slug: EditableStorySlug; initialCopy: ProjectStoryCopy }) {
  const scenes = storyEditorScenes(slug)
  const [copy, setCopy] = useState(initialCopy)
  const [state, action, pending] = useActionState(saveProjectStoryCopy.bind(null, slug), { success: false })
  const saved = state.savedCopy || initialCopy
  const changed = scenes.some(({ key }) => copy[key].title.trim() !== saved[key].title || copy[key].body.trim() !== saved[key].body)
  return <form action={action} className="space-y-6">
    <p className="text-muted-foreground">Completează titlul și descrierea de lângă fiecare fotografie. Câmpurile goale lasă zona liberă. Textele mai lungi sunt împărțite în pasaje la scroll pentru a rămâne lizibile pe telefon. Stilul vizual și imaginile proiectului se păstrează.</p>
    {scenes.map(({ key, label, photo }) => <fieldset key={key} className="mimesiss-card p-5 sm:p-6">
      <legend className="px-2 font-semibold">{label}</legend>
      <div className="grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Image src={photo.src} alt={photo.alt} width={140} height={140} sizes="140px" className="h-auto w-28 sm:w-full" />
        <div className="space-y-4 min-w-0">
          <div><label htmlFor={key + '-title'} className="block text-sm font-medium mb-1">Titlu</label>
          <input id={key + '-title'} name={key + '.title'} maxLength={tentCopyLimits.title} value={copy[key].title} onChange={event => setCopy(current => ({ ...current, [key]: { ...current[key], title: event.target.value } }))} className="mimesiss-input" />
          <p className="mt-1 text-xs text-muted-foreground">{copy[key].title.length} / {tentCopyLimits.title} caractere</p></div>
          <div><label htmlFor={key + '-body'} className="block text-sm font-medium mb-1">Descriere</label>
          <textarea id={key + '-body'} name={key + '.body'} rows={6} maxLength={tentCopyLimits.body} value={copy[key].body} onChange={event => setCopy(current => ({ ...current, [key]: { ...current[key], body: event.target.value } }))} className="mimesiss-input" />
          <p className="mt-1 text-xs text-muted-foreground">{copy[key].body.length} / {tentCopyLimits.body} caractere</p></div>
        </div>
      </div>
    </fieldset>)}
    {state.error && <p role="alert" className="text-destructive">{state.error}</p>}
    {state.message && !changed && <p role="status">{state.message}</p>}
    {changed && <p role="status" className="text-muted-foreground">Modificări nesalvate.</p>}
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={pending || !changed} className="mimesiss-btn-primary sm:w-auto sm:px-8">{pending ? 'Se salvează…' : 'Salvează textele'}</button><Link href={'/proiecte/' + slug} target="_blank" className="mimesiss-btn-secondary sm:w-auto sm:px-8">Vezi pagina publică</Link></div>
  </form>
}

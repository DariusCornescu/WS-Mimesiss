'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { saveTentStoryCopy } from '@/app/admin/proiecte/cortul-imm/actions'
import { tentSceneKeys, tentCopyLimits, type TentStoryCopy } from '@/lib/tent-story-copy'
import { tentStoryPhotos } from '@/components/project-stories/lib/event-stories'

export default function TentStoryForm({ initialCopy, preview = false }: { initialCopy: TentStoryCopy; preview?: boolean }) {
  const [copy, setCopy] = useState(initialCopy)
  const [state, action, pending] = useActionState(saveTentStoryCopy, { success: false })
  const saved = state.savedCopy || initialCopy
  const changed = tentSceneKeys.some(key => copy[key].title.trim() !== saved[key].title || copy[key].body.trim() !== saved[key].body)
  return <form action={preview ? undefined : action} onSubmit={preview ? event => event.preventDefault() : undefined} className="space-y-6">
    <p className="text-muted-foreground">Completează titlul și descrierea de lângă fiecare imagine. Câmpurile goale lasă zona liberă pe site. Textele mai lungi sunt împărțite automat în pasaje la scroll, pentru a rămâne lizibile pe telefon.</p>
    {tentSceneKeys.map((key, index) => <fieldset key={key} className="mimesiss-card p-5 sm:p-6">
      <legend className="px-2 font-semibold">{['Investigații imagistice', 'Primul ajutor', 'Resuscitare'][index]}</legend>
      <div className="grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
        <Image src={tentStoryPhotos[index].src} alt={tentStoryPhotos[index].alt} width={140} height={175} sizes="140px" className="h-auto w-28 sm:w-full" />
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
    {changed && !preview && <p role="status" className="text-muted-foreground">Modificări nesalvate.</p>}
    <div className="flex flex-wrap gap-3">
      <button type="submit" disabled={pending || preview || !changed} className="mimesiss-btn-primary sm:w-auto sm:px-8">{pending ? 'Se salvează…' : 'Salvează textele'}</button>
      <Link href="/proiecte/cortul-imm" target="_blank" className="mimesiss-btn-secondary sm:w-auto sm:px-8">Vezi pagina publică</Link>
    </div>
  </form>
}

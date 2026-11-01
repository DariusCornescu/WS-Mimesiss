'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import type { AdminProject, ProjectFormState } from '@/app/admin/proiecte/actions'
import { prepareMediaUpload } from '@/lib/media-upload'
import MediaLibraryPicker from './MediaLibraryPicker'

type EditableProject = {
  title: string; summary: string; description: string; kicker: string
  kind: AdminProject['kind']; status: AdminProject['status']; coverImage: string
  slug: string; order: string; coverPositionX: number; coverPositionY: number
}
type LocalDraft = { version: 1; token: string; fields: EditableProject }
const draftKey = (id: string) => `mimesiss:project-draft:${id}`
const validToken = (token: unknown): token is string => typeof token === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(token)

function readDraft(raw: string): LocalDraft | null {
  const draft = JSON.parse(raw) as LocalDraft
  if (draft.version !== 1 || !validToken(draft.token) || !draft.fields) return null
  const fields = draft.fields
  const limits = { title: 160, summary: 400, description: 20000, kicker: 60, coverImage: 500, slug: 180, order: 100 }
  for (const [key, max] of Object.entries(limits)) {
    const value = fields[key as keyof typeof limits]
    if (typeof value !== 'string' || value.length > max) return null
  }
  if (!['standard', 'announcement', 'congress'].includes(fields.kind) || !['draft', 'published'].includes(fields.status)) return null
  if (![fields.coverPositionX, fields.coverPositionY].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return null
  return draft
}

export function LocalProjectDraftCleanup({ id, token }: { id?: string; token?: string }) {
  const [error, setError] = useState('')
  useEffect(() => {
    if (!id || !/^(new|[a-f0-9]{24})$/.test(id) || !validToken(token)) return
    try {
      const raw = localStorage.getItem(draftKey(id))
      if (raw && readDraft(raw)?.token === token) localStorage.removeItem(draftKey(id))
    } catch {
      queueMicrotask(() => setError('Postarea a fost salvată pe site, dar ciorna locală nu a putut fi eliminată din acest browser.'))
    }
  }, [id, token])
  return error ? <p role="status" className="text-sm text-muted-foreground">{error}</p> : null
}

export default function ProjectForm({ action, project, submitLabel }: {
  action: (state: ProjectFormState, data: FormData) => Promise<ProjectFormState>
  project?: AdminProject
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  const [fields, setFields] = useState<EditableProject>(() => ({
    title: project?.title || '', summary: project?.summary || '', description: project?.description || '',
    kicker: project?.kicker || '', kind: project?.kind || 'standard', coverImage: project?.coverImage || '',
    slug: project?.slug || '', order: String(project?.order ?? 0), status: project?.status || 'draft',
    coverPositionX: project?.coverPositionX ?? 50, coverPositionY: project?.coverPositionY ?? 50,
  }))
  const { title, summary, description, kicker, kind, coverImage, slug, order, status, coverPositionX, coverPositionY } = fields
  function setField<K extends keyof EditableProject>(key: K, value: EditableProject[K]) { setFields(current => ({ ...current, [key]: value })) }
  const [initialFingerprint] = useState(() => JSON.stringify(fields))
  const fingerprint = JSON.stringify(fields)
  const dirty = fingerprint !== initialFingerprint
  const recoveryId = project?._id || 'new'
  const [recoveryToken, setRecoveryToken] = useState('')
  const [recovery, setRecovery] = useState<LocalDraft | null>(null)
  const [storageReady, setStorageReady] = useState(false)
  const [savedFingerprint, setSavedFingerprint] = useState('')
  const [localError, setLocalError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [preview, setPreview] = useState<'card' | 'article'>('card')
  const label = kicker || (kind === 'announcement' ? 'Anunț ASMM' : 'Proiect ASMM')

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      let token = ''
      try {
        token = crypto.randomUUID()
        setRecoveryToken(token)
        const raw = localStorage.getItem(draftKey(recoveryId))
        if (raw) {
          const draft = readDraft(raw)
          if (draft && JSON.stringify(draft.fields) !== initialFingerprint) setRecovery(draft)
          else localStorage.removeItem(draftKey(recoveryId))
        }
      } catch { setLocalError('Ciorna locală nu poate fi citită în acest browser. Salvează postarea folosind butonul de mai jos.') }
      setStorageReady(Boolean(token))
    })
    return () => { active = false }
  }, [recoveryId, initialFingerprint])

  useEffect(() => {
    if (!storageReady || !dirty || recovery || pending) return
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey(recoveryId), JSON.stringify({ version: 1, token: recoveryToken, fields: JSON.parse(fingerprint) }))
        setSavedFingerprint(fingerprint)
        setLocalError('')
      } catch { setLocalError('Ciorna locală nu a putut fi salvată. Păstrează această pagină deschisă și salvează postarea folosind butonul de mai jos.') }
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [fingerprint, storageReady, dirty, recovery, pending, recoveryId, recoveryToken])

  useEffect(() => {
    if (!dirty || pending) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, pending])

  async function upload(file?: File) {
    if (!file) return
    setUploadError('')
    setUploading(true)
    try {
      const body = await prepareMediaUpload(file)
      const response = await fetch('/api/admin/project-images', { method: 'POST', headers: { 'Content-Type': body.type, 'x-file-name': encodeURIComponent(file.name) }, body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Încărcarea a eșuat.')
      setField('coverImage', result.url)
    } catch (error) { setUploadError(error instanceof Error ? error.message : 'Încărcarea a eșuat. Încearcă din nou.') }
    finally { setUploading(false) }
  }

  return <form action={formAction} className="grid gap-6 xl:grid-cols-[1.15fr_1fr]" onSubmit={() => {
    if (!storageReady || !dirty || recovery) return
    try {
      localStorage.setItem(draftKey(recoveryId), JSON.stringify({ version: 1, token: recoveryToken, fields }))
      setSavedFingerprint(fingerprint)
      setLocalError('')
    } catch { setLocalError('Ciorna locală nu a putut fi salvată în acest browser. Se încearcă salvarea postării pe site.') }
  }}>
    <input type="hidden" name="recoveryKey" value={recoveryId} />
    <input type="hidden" name="recoveryToken" value={recoveryToken} />
    <fieldset disabled={pending} className="min-w-0 space-y-5">
      {recovery && <section className="rounded-xl border border-accent/40 bg-accent/5 p-5" aria-label="Recuperează ciorna locală"><h2 className="font-semibold">Ai o ciornă locală nesalvată pe site</h2><p className="mt-2 text-sm text-muted-foreground">Poți recupera modificările din acest browser. Conținutul publicat rămâne cel salvat pe site până când apeși Salvează.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" className="mimesiss-btn-primary" onClick={() => {
        setFields({ ...recovery.fields, kind: project?.kind === 'congress' ? 'congress' : recovery.fields.kind === 'congress' ? 'standard' : recovery.fields.kind })
        setRecoveryToken(recovery.token)
        setRecovery(null)
      }}>Recuperează modificările</button><button type="button" className="mimesiss-btn-secondary" onClick={() => {
        try { localStorage.removeItem(draftKey(recoveryId)); setLocalError(''); setRecovery(null) }
        catch { setLocalError('Ciorna locală nu a putut fi eliminată din acest browser.') }
      }}>Renunță la ciorna locală</button></div></section>}
      {localError && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{localError}</p>}
      {!localError && savedFingerprint === fingerprint && dirty && <p role="status" className="text-sm text-muted-foreground">Ciornă locală salvată · în acest browser. Folosește Salvează pentru a trimite modificările pe site.</p>}
      <section className="mimesiss-card space-y-5 p-5 sm:p-6" aria-labelledby="content-title">
        <div><p className="text-xs font-bold uppercase tracking-widest text-accent">01 · Conținut</p><h2 id="content-title" className="mt-2 text-xl font-semibold">O poveste, un format consecvent</h2><p className="mt-2 text-sm text-muted-foreground">Adaugă textul și o fotografie. Aspectul postării se construiește automat.</p></div>
        <div><label htmlFor="kind" className="mb-2 block text-sm font-medium">Ce publici?</label><select id="kind" name="kind" className="mimesiss-input" value={kind} onChange={e => setField('kind', e.target.value as typeof kind)} disabled={project?.kind === 'congress'}><option value="standard">Proiect</option><option value="announcement">Anunț</option>{project?.kind === 'congress' && <option value="congress">Congres · proiect protejat</option>}</select>{project?.kind === 'congress' && <input type="hidden" name="kind" value="congress" />}</div>
        <div><label htmlFor="title" className="mb-2 block text-sm font-medium">Titlu *</label><input id="title" name="title" required maxLength={160} className="mimesiss-input" placeholder="Un titlu clar, ușor de reținut" value={title} onChange={e => setField('title', e.target.value)} /></div>
        <div><label htmlFor="summary" className="mb-2 block text-sm font-medium">Pe scurt *</label><textarea id="summary" name="summary" required maxLength={400} rows={3} className="mimesiss-input" placeholder="Una sau două propoziții pentru cardul de pe site." value={summary} onChange={e => setField('summary', e.target.value)} /><p className="mt-1 text-right text-xs text-muted-foreground">{summary.length}/400</p></div>
        <div><label htmlFor="description" className="mb-2 block text-sm font-medium">Textul postării</label><textarea id="description" name="description" maxLength={20000} rows={9} className="mimesiss-input" placeholder="Povestește despre proiect. Separă paragrafele printr-un rând gol." value={description} onChange={e => setField('description', e.target.value)} /><p className="mt-2 text-xs text-muted-foreground">Textul apare pe pagina deschisă la apăsarea cardului.</p></div>
      </section>
      <section className="mimesiss-card space-y-4 p-5 sm:p-6" aria-labelledby="image-title">
        <div><p className="text-xs font-bold uppercase tracking-widest text-accent">02 · Imagine</p><h2 id="image-title" className="mt-2 text-xl font-semibold">Fotografia de copertă</h2></div>
        <label htmlFor="image-upload" className="block rounded-xl border border-dashed border-accent/40 bg-accent/5 p-5 text-sm">{uploading ? 'Se pregătește și se încarcă imaginea…' : 'Alege sau înlocuiește fotografia'}<input id="image-upload" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} className="mt-3 block w-full text-sm" onChange={e => { void upload(e.target.files?.[0]); e.target.value = '' }} /><span className="mt-3 block text-xs text-muted-foreground">JPG, PNG sau WebP · maximum 25 MB. Fotografiile mari sunt optimizate automat. Recomandat: imagine orizontală, 1600 × 1000 px.</span></label>
        <MediaLibraryPicker disabled={uploading || pending} onSelect={photo => setField('coverImage', photo.url)} />
        <input type="hidden" name="coverImage" value={coverImage} />
        {coverImage && <button type="button" disabled={uploading} onClick={() => setField('coverImage', '')} className="text-sm text-muted-foreground underline">Elimină imaginea</button>}
        {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
      </section>
      <details className="mimesiss-card p-5"><summary className="cursor-pointer font-medium">Opțiuni avansate</summary><div className="mt-5 space-y-4">
        <div><label htmlFor="kicker" className="mb-2 block text-sm">Etichetă personalizată</label><input id="kicker" name="kicker" maxLength={60} value={kicker} onChange={e => setField('kicker', e.target.value)} className="mimesiss-input" placeholder="ex. Voluntariat" /></div>
        <div><label htmlFor="slug" className="mb-2 block text-sm">Adresa paginii</label><input id="slug" name="slug" maxLength={180} value={slug} onChange={e => setField('slug', e.target.value)} className="mimesiss-input" placeholder="Se generează automat din titlu" /><p className="mt-2 text-xs text-muted-foreground">La editare, păstrează adresa pentru ca linkurile distribuite să funcționeze.</p></div>
        <div><label htmlFor="order" className="mb-2 block text-sm">Ordine în listă</label><input id="order" name="order" type="number" value={order} onChange={e => setField('order', e.target.value)} className="mimesiss-input" /></div>
        <div><label htmlFor="existing-image" className="mb-2 block text-sm">Imagine existentă pe site</label><input id="existing-image" maxLength={500} value={coverImage} onChange={e => setField('coverImage', e.target.value)} className="mimesiss-input" placeholder="/old/3.jpeg" /></div>
        <div className="space-y-4"><p className="text-sm font-medium">Încadrarea fotografiei</p><p className="text-xs text-muted-foreground">Mută punctul de interes și urmărește previzualizarea. Astfel, fețele rămân în cadru pe cardurile site-ului.</p><div><label htmlFor="coverPositionX" className="mb-2 block text-sm">Poziție orizontală · {coverPositionX}%</label><input id="coverPositionX" name="coverPositionX" type="range" min={0} max={100} value={coverPositionX} onChange={e => setField('coverPositionX', Number(e.target.value))} className="w-full accent-accent" /></div><div><label htmlFor="coverPositionY" className="mb-2 block text-sm">Poziție verticală · {coverPositionY}%</label><input id="coverPositionY" name="coverPositionY" type="range" min={0} max={100} value={coverPositionY} onChange={e => setField('coverPositionY', Number(e.target.value))} className="w-full accent-accent" /></div></div>
      </div></details>
      <section className="mimesiss-card space-y-4 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">03 · Publicare</p>
        <label htmlFor="status" className="block text-sm font-medium">Vizibilitate</label><select id="status" name="status" className="mimesiss-input" value={status} onChange={e => setField('status', e.target.value as typeof status)}><option value="draft">Ciornă · vizibilă doar administratorilor</option><option value="published">Publicat · vizibil pe site</option></select>
        <p className="text-xs text-muted-foreground">Publicarea necesită un titlu, o introducere și o imagine. Poți reveni oricând la ciornă.</p>
        {state.error && <p role="alert" className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive">{state.error}</p>}
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={uploading || pending} className="mimesiss-btn-primary disabled:opacity-50">{pending ? 'Se salvează…' : submitLabel}</button><Link href="/admin/proiecte" className="mimesiss-btn-secondary">Anulează</Link></div>
      </section>
    </fieldset>
    <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start" aria-label="Previzualizarea postării">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Previzualizare live</span><div className="flex gap-2">{(['card', 'article'] as const).map(mode => <button key={mode} type="button" aria-pressed={preview === mode} onClick={() => setPreview(mode)} className={preview === mode ? 'rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground' : 'rounded-lg border border-border px-3 py-2 text-sm'}>{mode === 'card' ? 'Card' : 'Pagina'}</button>)}</div></div>
      <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="relative aspect-[8/5] bg-muted">{coverImage && coverImage.startsWith('/') && !coverImage.startsWith('//') ? <Image src={coverImage} alt="" fill unoptimized sizes="(max-width: 1280px) 100vw, 40vw" className="object-cover" style={{ objectPosition: `${coverPositionX}% ${coverPositionY}%` }} /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><span className="text-4xl font-light">ASMM</span><span className="text-xs uppercase tracking-widest">Imaginea ta, aici</span></div>}</div>
        <div className="space-y-4 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-accent">{label}</p><h2 className="break-words text-3xl font-semibold leading-tight">{title || 'Titlul postării tale'}</h2><p className="whitespace-pre-line break-words leading-relaxed text-muted-foreground">{summary || 'O introducere scurtă care invită cititorii să descopere mai mult.'}</p>{preview === 'card' ? <span className="inline-block border-b border-accent pb-1 text-sm font-semibold">{kind === 'announcement' ? 'Citește anunțul' : 'Descoperă proiectul'} →</span> : <div className="space-y-5 border-t border-border pt-5 text-sm leading-7">{description.split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => <p key={i} className="whitespace-pre-line break-words">{paragraph}</p>)}</div>}</div>
      </article><p className="mt-3 text-xs leading-5 text-muted-foreground">Previzualizare a conținutului. Fotografiile sunt încadrate automat, iar aspectul se adaptează ecranului.</p>
    </aside>
  </form>
}

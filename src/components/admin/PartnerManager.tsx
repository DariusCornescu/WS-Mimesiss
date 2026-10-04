'use client'

import Image from 'next/image'
import { useRef, useState, type FormEvent } from 'react'
import PageIntro from '@/components/ui/PageIntro'
import { prepareMediaUpload } from '@/lib/media-upload'
import type { Partner } from '@/lib/partner-types'

const emptyPartner = (): Partner => ({ id: '', name: '', logo: '', category: 'institutional', visible: false, order: 0 })
const fieldClass = 'mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground'
const buttonClass = 'rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50'

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const result = await response.json().catch(() => ({ error: 'Serverul nu a răspuns corect.' }))
  if (!response.ok) throw new Error(result.error || 'Operația a eșuat.')
  return result as T
}

export default function PartnerManager({ partners: initial }: { partners: Partner[] }) {
  const [partners, setPartners] = useState(initial)
  const [editor, setEditor] = useState<Partner>(emptyPartner)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const lock = useRef(false)

  async function run(action: () => Promise<void>) {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try { await action() }
    catch (error) { setError(error instanceof Error ? error.message : 'Operația a eșuat.') }
    finally { lock.current = false; setBusy(false) }
  }

  function reset() {
    setEditor(emptyPartner())
    if (fileInput.current) fileInput.current.value = ''
  }

  async function upload(file: File) {
    await run(async () => {
      const blob = await prepareMediaUpload(file)
      const result = await request<{ url: string }>('/api/admin/project-images', {
        method: 'POST', headers: { 'Content-Type': blob.type, 'x-file-name': encodeURIComponent(file.name) }, body: blob,
      })
      setEditor(current => ({ ...current, logo: result.url }))
      setNotice('Logo încărcat. Salvează intrarea pentru a păstra modificarea.')
    })
    if (fileInput.current) fileInput.current.value = ''
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run(async () => {
      if (!editor.logo) throw new Error('Încarcă un logo înainte de salvare.')
      const { id, ...values } = editor
      const result = await request<{ partner: Partner }>('/api/admin/partners', {
        method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { id, ...values } : values),
      })
      setPartners(current => [...current.filter(item => item.id !== result.partner.id), result.partner])
      reset()
      setNotice('Intrarea a fost salvată.')
    })
  }

  async function remove(partner: Partner) {
    if (!window.confirm(`Ștergi ${partner.name || 'această intrare'}?`)) return
    await run(async () => {
      await request('/api/admin/partners', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: partner.id }) })
      setPartners(current => current.filter(item => item.id !== partner.id))
      if (editor.id === partner.id) reset()
      setNotice('Intrarea a fost ștearsă.')
    })
  }

  return <div className="space-y-6">
    <PageIntro eyebrow="Administrare ASMM" title="Parteneri și sponsori" description="Adaugă siglele partenerilor instituționali și ale sponsorilor. Publică fiecare intrare doar după aprobare. Categoriile fără intrări vizibile sunt ascunse pe site." />
    {error && <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">{error}</p>}
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{notice}</p>
    <form onSubmit={save} className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-xl font-bold">{editor.id ? 'Editează intrarea' : 'Adaugă o intrare'}</h2>
      <fieldset disabled={busy} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold">Categorie<select className={fieldClass} value={editor.category} onChange={event => setEditor({ ...editor, category: event.target.value as Partner['category'] })}><option value="institutional">Partener instituțional</option><option value="sponsor">Sponsor</option></select></label>
          <label className="text-sm font-semibold">Nume (opțional)<input className={fieldClass} maxLength={160} value={editor.name} onChange={event => setEditor({ ...editor, name: event.target.value })} /></label>
          <label className="text-sm font-semibold">Logo (obligatoriu)<input ref={fileInput} className={fieldClass} type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file) }} /><span className="mt-2 block font-normal text-muted-foreground">PNG, JPG sau WebP. Pentru transparență, folosește PNG sau WebP.</span></label>
          <label className="text-sm font-semibold">Ordine de afișare<input className={fieldClass} type="number" min={0} max={9999} required value={editor.order} onChange={event => setEditor({ ...editor, order: Number(event.target.value) })} /><span className="mt-2 block font-normal text-muted-foreground">Numerele mai mici apar primele.</span></label>
        </div>
        {editor.logo && <Image src={editor.logo} alt={editor.name || 'Previzualizare logo'} width={200} height={150} unoptimized className="h-32 w-48 rounded-lg bg-foreground/10 object-contain p-3" />}
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={editor.visible} onChange={event => setEditor({ ...editor, visible: event.target.checked })} />Vizibil pe site — aprobat pentru publicare</label>
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={!editor.logo} className={`${buttonClass} bg-primary text-primary-foreground`}>{busy ? 'Se procesează…' : 'Salvează'}</button><button type="button" className={buttonClass} onClick={reset}>{editor.id ? 'Anulează editarea' : 'Resetează'}</button></div>
      </fieldset>
    </form>
    {(['institutional', 'sponsor'] as const).map(category => <section key={category} className="space-y-3">
      <h2 className="text-xl font-bold">{category === 'institutional' ? 'Parteneri instituționali' : 'Sponsori'}</h2>
      {!partners.some(item => item.category === category) && <p className="text-sm text-muted-foreground">Nu există intrări în această categorie. Secțiunea este ascunsă pe site.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{partners.filter(item => item.category === category).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map(partner => <article key={partner.id} className="space-y-3 rounded-xl border border-border bg-card p-4">
        <Image src={partner.logo} alt={partner.name || (category === 'institutional' ? 'Logo partener instituțional' : 'Logo sponsor')} width={200} height={150} unoptimized className="h-32 w-full rounded-lg bg-foreground/10 object-contain p-3" />
        <h3 className="break-words font-semibold">{partner.name || 'Fără nume'}</h3><p className="text-sm text-muted-foreground">{partner.visible ? 'Vizibil pe site' : 'Ascuns'} · Ordine: {partner.order}</p>
        <div className="flex flex-wrap gap-2"><button disabled={busy} className={buttonClass} onClick={() => { setEditor({ ...partner }); setError(''); setNotice(''); if (fileInput.current) fileInput.current.value = '' }}>Editează</button><button disabled={busy} className={`${buttonClass} text-destructive`} onClick={() => void remove(partner)}>Șterge</button></div>
      </article>)}</div>
    </section>)}
  </div>
}

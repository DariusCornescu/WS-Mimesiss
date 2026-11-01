'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import type { LibraryPhoto } from '@/lib/gallery-types'

export default function MediaLibraryPicker({ onSelect, buttonLabel = 'Alege din biblioteca foto', disabled = false }: {
  onSelect: (photo: LibraryPhoto) => void
  buttonLabel?: string
  disabled?: boolean
}) {
  const titleId = useId()
  const dialog = useRef<HTMLDialogElement>(null)
  const request = useRef<AbortController | null>(null)
  const [photos, setPhotos] = useState<LibraryPhoto[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [failedCursor, setFailedCursor] = useState<string | null>(null)
  useEffect(() => () => request.current?.abort(), [])

  async function load(cursor: string | null = null) {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError('')
    setFailedCursor(cursor)
    try {
      const response = await fetch(`/api/admin/project-images${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`, { signal: controller.signal })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Biblioteca foto nu poate fi încărcată.')
      if (!Array.isArray(result.photos)) throw new Error('Răspunsul bibliotecii foto este invalid.')
      setPhotos(current => cursor ? [...current, ...result.photos] : result.photos)
      setNextCursor(result.nextCursor || null)
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Biblioteca foto nu poate fi încărcată.')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return <>
    <button type="button" disabled={disabled} className="mimesiss-btn-secondary disabled:opacity-50" onClick={() => {
      setPhotos([])
      setNextCursor(null)
      dialog.current?.showModal()
      void load()
    }}>{buttonLabel}</button>
    <dialog ref={dialog} aria-labelledby={titleId} className="m-auto max-h-[85vh] w-[min(92vw,800px)] overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl backdrop:bg-background/80 sm:p-6" onClose={() => request.current?.abort()}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-accent">Bibliotecă foto</p><h2 id={titleId} className="mt-2 text-xl font-semibold">O fotografie, mai multe povești</h2><p className="mt-2 text-sm text-muted-foreground">Reutilizează o fotografie încărcată deja pentru articole sau albume.</p></div>
        <button type="button" autoFocus className="min-h-11 shrink-0 rounded-lg border border-border px-3 text-sm" onClick={() => dialog.current?.close()} aria-label="Închide biblioteca foto">Închide</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(photo => <button key={photo.url} type="button" className="overflow-hidden rounded-xl border border-border bg-background text-left transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" onClick={() => { onSelect(photo); dialog.current?.close() }}>
          <div className="relative aspect-[4/3]"><Image src={photo.url} alt="" fill sizes="(max-width: 640px) 45vw, 240px" className="object-cover" /></div>
          <span className="block truncate p-3 text-sm" title={photo.name}>{photo.name || 'Fotografie'}</span>
        </button>)}
      </div>
      {!loading && !error && !photos.length && <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Biblioteca este goală. Încarcă o fotografie în formular pentru a o putea reutiliza.</p>}
      {loading && <p role="status" className="mt-5 text-sm text-muted-foreground">Se încarcă fotografiile…</p>}
      {error && <div role="alert" className="mt-5 space-y-3"><p className="text-sm text-destructive">{error}</p><button type="button" className="mimesiss-btn-secondary" onClick={() => void load(failedCursor)}>Încearcă din nou</button></div>}
      {!loading && !error && nextCursor && <button type="button" className="mimesiss-btn-secondary mt-5" onClick={() => void load(nextCursor)}>Mai multe fotografii</button>}
    </dialog>
  </>
}

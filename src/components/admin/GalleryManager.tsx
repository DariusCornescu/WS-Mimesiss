'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FaArrowDown, FaArrowUp, FaCheck, FaGripVertical, FaImages, FaPlus, FaTrash, FaUpload } from 'react-icons/fa'
import PageIntro from '@/components/ui/PageIntro'
import EventGallery from '@/components/asociatie/EventGallery'
import MediaLibraryPicker from '@/components/admin/MediaLibraryPicker'
import type { GalleryAlbum, GalleryPhoto, LibraryPhoto } from '@/lib/gallery-types'
import { prepareMediaUpload } from '@/lib/media-upload'
import styles from './GalleryManager.module.css'

type UploadItem = { id: number; file: File; status: 'waiting' | 'uploading' | 'done' | 'error'; error: string }
const copyAlbum = (album: GalleryAlbum) => ({ ...album, photos: album.photos.map(photo => ({ ...photo })) })
const countLabel = (count: number) => count === 1 ? 'o fotografie' : `${count} fotografii`

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  const result = await response.json().catch(() => ({ error: 'Serverul nu a răspuns corect. Încearcă din nou.' }))
  if (!response.ok) throw new Error(result.error || 'Operația a eșuat. Încearcă din nou.')
  return result as T
}

export default function GalleryManager({ albums: initialAlbums }: { albums: GalleryAlbum[] }) {
  const [albums, setAlbums] = useState(initialAlbums)
  const [editor, setEditor] = useState<GalleryAlbum | null>(null)
  const [baseline, setBaseline] = useState('')
  const [createOpen, setCreateOpen] = useState(initialAlbums.length === 0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(false)
  const uploadLock = useRef(false)
  const nextUploadId = useRef(0)
  const draggedPhoto = useRef<number | null>(null)
  const dirty = editor !== null && JSON.stringify(editor) !== baseline
  const locked = busy || uploading
  const visiblePhotos = editor?.photos.filter(photo => !photo.hidden) || []

  useEffect(() => {
    if (!dirty && !uploading) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const warnNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest('a') : null
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const target = new URL(link.href, window.location.href)
      if (target.pathname === window.location.pathname && target.search === window.location.search) return
      if (!window.confirm(uploading ? 'Fotografiile încă se încarcă. Părăsești pagina și pierzi modificările nesalvate?' : 'Ai modificări nesalvate. Părăsești pagina fără să le salvezi?')) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('beforeunload', warn)
    document.addEventListener('click', warnNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warn)
      document.removeEventListener('click', warnNavigation, true)
    }
  }, [dirty, uploading])

  function selectAlbum(album: GalleryAlbum) {
    if (locked || editor?.id === album.id) return
    if (dirty && !window.confirm('Ai modificări nesalvate. Deschizi alt album fără să le salvezi?')) return
    const selected = copyAlbum(album)
    setEditor(selected)
    setBaseline(JSON.stringify(selected))
    setUploads([])
    setError('')
    setNotice('')
    setPreview(false)
  }

  async function createAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (locked) return
    if (dirty && !window.confirm('Ai modificări nesalvate. Creezi un album nou fără să le salvezi?')) return
    const form = event.currentTarget
    const data = new FormData(form)
    const year = String(data.get('editionYear') || '')
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const { album } = await request<{ album: GalleryAlbum }>('/api/admin/gallery', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: data.get('title'), description: data.get('description'), editionYear: year ? Number(year) : null }),
      })
      setAlbums(current => [album, ...current])
      setEditor(copyAlbum(album))
      setBaseline(JSON.stringify(album))
      setUploads([])
      setPreview(false)
      form.reset()
      setCreateOpen(false)
      setNotice('Albumul a fost creat ca ciornă. Adaugă fotografiile, apoi salvează sau publică.')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Albumul nu a putut fi creat.') }
    finally { setBusy(false) }
  }

  function update(field: 'title' | 'description' | 'editionYear', value: string) {
    setNotice('')
    setEditor(current => current && { ...current, [field]: field === 'editionYear' ? (value === '' ? null : Number(value)) : value })
  }

  function setPhotos(photos: GalleryPhoto[]) {
    setNotice('')
    setEditor(current => current && {
      ...current, photos,
      coverImage: photos.some(photo => !photo.hidden && photo.url === current.coverImage) ? current.coverImage : (photos.find(photo => !photo.hidden)?.url || ''),
    })
  }

  function addPhoto(photo: LibraryPhoto) {
    setNotice('')
    if (!editor || locked) return
    if (editor.photos.some(existing => existing.url === photo.url)) { setError('Fotografia există deja în acest album.'); return }
    if (editor.photos.length >= 200) { setError('Un album poate conține cel mult 200 de fotografii.'); return }
    setError('')
    setPhotos([...editor.photos, { url: photo.url, alt: '', caption: '', hidden: false }])
  }

  async function uploadEntries(entries: UploadItem[]) {
    if (uploadLock.current) return
    if (!editor) return
    if (editor.photos.length + entries.length > 200) {
      const message = 'Albumul poate conține cel mult 200 de fotografii. Elimină o fotografie din album, apoi reîncearcă.'
      const failedIds = new Set(entries.map(item => item.id))
      setUploads(current => current.map(item => failedIds.has(item.id) ? { ...item, status: 'error', error: message } : item))
      setError(message)
      return
    }
    uploadLock.current = true
    setUploading(true)
    setNotice('')
    for (const entry of entries) {
      setUploads(current => current.map(item => item.id === entry.id ? { ...item, status: 'uploading', error: '' } : item))
      try {
        const prepared = await prepareMediaUpload(entry.file)
        const { url } = await request<{ url: string }>('/api/admin/project-images', {
          method: 'POST', headers: { 'Content-Type': prepared.type, 'x-file-name': encodeURIComponent(entry.file.name) }, body: prepared,
        })
        setEditor(current => {
          if (!current || current.photos.some(photo => photo.url === url)) return current
          return { ...current, coverImage: current.coverImage || url, photos: [...current.photos, { url, alt: '', caption: '', hidden: false }] }
        })
        setUploads(current => current.map(item => item.id === entry.id ? { ...item, status: 'done' } : item))
      } catch (failure) {
        setUploads(current => current.map(item => item.id === entry.id ? { ...item, status: 'error', error: failure instanceof Error ? failure.message : 'Încărcarea a eșuat.' } : item))
      }
    }
    uploadLock.current = false
    setUploading(false)
  }

  async function uploadFiles(files: File[]) {
    if (!editor || locked || uploadLock.current || files.length === 0) return
    setError('')
    if (files.length > 50) { setError('Încarcă cel mult 50 de fotografii într-o singură serie.'); return }
    if (files.length + editor.photos.length > 200) { setError('Un album poate conține cel mult 200 de fotografii.'); return }
    const entries = files.map(file => ({ id: ++nextUploadId.current, file, status: 'waiting' as const, error: '' }))
    setUploads(current => [...current, ...entries])
    await uploadEntries(entries)
  }

  function movePhoto(from: number, to: number) {
    if (!editor || locked || from === to || to < 0 || to >= editor.photos.length) return
    const photos = [...editor.photos]
    const [photo] = photos.splice(from, 1)
    photos.splice(to, 0, photo)
    setPhotos(photos)
  }

  async function save(status: GalleryAlbum['status']) {
    if (!editor || locked) return
    setError('')
    setNotice('')
    if (!editor.title.trim()) { setError('Adaugă un titlu pentru album.'); return }
    if (status === 'published' && visiblePhotos.length === 0) { setError('Adaugă cel puțin o fotografie vizibilă înainte de publicare.'); return }
    setBusy(true)
    try {
      const { album } = await request<{ album: GalleryAlbum }>(`/api/admin/gallery/${editor.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editor.title, description: editor.description, editionYear: editor.editionYear, photos: editor.photos, coverImage: editor.coverImage || visiblePhotos[0]?.url || '', status, revision: editor.revision }),
      })
      setEditor(copyAlbum(album))
      setBaseline(JSON.stringify(album))
      setAlbums(current => current.map(item => item.id === album.id ? album : item))
      setNotice(status === 'published' ? 'Albumul a fost salvat și este vizibil în galeria publică.' : 'Ciorna a fost salvată. Albumul este vizibil doar administratorilor.')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Modificările nu au putut fi salvate.') }
    finally { setBusy(false) }
  }

  async function deleteAlbum() {
    if (!editor || locked || !window.confirm(`Elimini albumul „${editor.title}” din galerie? Fotografiile rămân în biblioteca foto.${dirty ? ' Modificările nesalvate se vor pierde.' : ''}`)) return
    setBusy(true)
    setError('')
    try {
      await request(`/api/admin/gallery/${editor.id}`, { method: 'DELETE' })
      setAlbums(current => current.filter(album => album.id !== editor.id))
      setEditor(null)
      setBaseline('')
      setUploads([])
      setNotice('Albumul a fost eliminat din galerie. Fotografiile pot fi reutilizate din bibliotecă.')
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Albumul nu a putut fi eliminat.') }
    finally { setBusy(false) }
  }

  return <div className={styles.manager}>
    <PageIntro eyebrow="Administrare · Galerie" title="Galerie MIMESISS" description="O ediție, un album, toate amintirile la un loc. Încarcă fotografiile, alege coperta și publică atunci când totul este pregătit." actions={<Link href="/congres/gallery" target="_blank" className={styles.secondary}>Vezi galeria publică ↗</Link>} />
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    <div className={styles.workspace}>
      <aside className={styles.albums} aria-label="Albumele galeriei">
        <div className={styles.sectionHeading}><h2>Albume <span>{albums.length}</span></h2><button type="button" className={styles.smallButton} onClick={() => setCreateOpen(value => !value)} disabled={locked} aria-expanded={createOpen}><FaPlus aria-hidden="true" /> Nou</button></div>
        <form hidden={!createOpen} onSubmit={event => { void createAlbum(event) }} className={styles.createForm}>
          <fieldset disabled={locked}>
            <label htmlFor="new-album-title">Titlul albumului *</label><input id="new-album-title" name="title" required maxLength={120} placeholder="MIMESISS · Împreună în practică" className="mimesiss-input" />
            <label htmlFor="new-album-year">Anul ediției <span>opțional</span></label><input id="new-album-year" name="editionYear" type="number" min={1900} max={2100} placeholder="ex. 2026" className="mimesiss-input" />
            <label htmlFor="new-album-description">Pe scurt <span>opțional</span></label><textarea id="new-album-description" name="description" rows={3} maxLength={1000} className="mimesiss-input" placeholder="Ce poveste spun fotografiile?" />
            <button type="submit" className={styles.primary}>{busy ? 'Se creează…' : 'Creează o ciornă'}</button>
          </fieldset>
        </form>
        <div className={styles.albumList}>
          {albums.map(album => <button type="button" key={album.id} onClick={() => selectAlbum(album)} disabled={locked} aria-pressed={editor?.id === album.id} className={`${styles.albumItem} ${editor?.id === album.id ? styles.activeAlbum : ''}`}>
            <span className={styles.albumThumb}>{album.coverImage ? <Image src={album.coverImage} alt="" fill sizes="70px" /> : <FaImages aria-hidden="true" />}</span>
            <span className={styles.albumInfo}><strong>{album.title}</strong><span>{album.editionYear ? `Ediția ${album.editionYear}` : album.legacy ? 'Arhivă · fără an' : 'Album fără an'}</span><span>{album.status === 'published' ? 'Publicat' : 'Ciornă'} · {countLabel(album.photos.length)}</span></span>
          </button>)}
          {!albums.length && <p className={styles.muted}>Creează primul album. Îl poți pregăti în ritmul tău înainte de publicare.</p>}
        </div>
      </aside>

      {!editor ? <section className={styles.welcome}><FaImages aria-hidden="true" /><h2>Fiecare album spune o poveste.</h2><p>Selectează un album pentru editare sau creează unul nou pentru următoarea ediție MIMESISS.</p><p className={styles.muted}>Fotografiile existente sunt păstrate în albumul Arhivă.</p></section> : <div className={styles.editor}>
        <header className={styles.editorHeader}>
          <div><p className={styles.eyebrow}>{editor.status === 'published' ? 'Album publicat' : 'Ciornă'}{editor.legacy ? ' · Arhivă existentă' : ''}</p><h2>{editor.title}</h2><p className={styles.saveState}>{uploading ? 'Se încarcă fotografiile…' : dirty ? 'Modificări nesalvate' : 'Toate modificările sunt salvate'}</p></div>
          <div className={styles.tabs}>{[false, true].map(value => <button type="button" key={String(value)} className={preview === value ? styles.activeTab : ''} aria-pressed={preview === value} onClick={() => setPreview(value)}>{value ? 'Previzualizare' : 'Editează'}</button>)}</div>
        </header>

        {preview ? <section className={styles.preview} aria-label="Previzualizarea albumului">
          <p className={styles.muted}>Așa vor apărea fotografiile vizibile. Modificările devin publice după salvare.</p>
          <div className={styles.previewIntro}><p className={styles.eyebrow}>{editor.editionYear ? `Ediția ${editor.editionYear}` : editor.legacy ? 'Arhivă MIMESISS' : 'Album MIMESISS'} · {countLabel(visiblePhotos.length)}</p><h2>{editor.title}</h2>{editor.description && <p className={styles.description}>{editor.description}</p>}</div>
          <EventGallery photos={editor.photos} title={editor.title} />
        </section> : <>
          <fieldset disabled={locked} className={styles.details}>
            <div className={styles.field}><label htmlFor="album-title">Titlul albumului *</label><input id="album-title" value={editor.title} onChange={event => update('title', event.target.value)} maxLength={120} required className="mimesiss-input" /></div>
            <div className={styles.field}><label htmlFor="album-year">Anul ediției <span>opțional</span></label><input id="album-year" value={editor.editionYear ?? ''} type="number" min={1900} max={2100} onChange={event => update('editionYear', event.target.value)} className="mimesiss-input" placeholder="ex. 2026" /></div>
            <div className={`${styles.field} ${styles.descriptionField}`}><label htmlFor="album-description">Descriere <span>opțional</span></label><textarea id="album-description" rows={3} maxLength={1000} value={editor.description} onChange={event => update('description', event.target.value)} className="mimesiss-input" placeholder="O scurtă introducere pentru vizitatori." /></div>
          </fieldset>
          <section className={styles.uploadSection} aria-labelledby="album-upload-title">
            <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Fotografii</p><h3 id="album-upload-title">Construiește albumul</h3></div><MediaLibraryPicker disabled={locked || editor.photos.length >= 200} onSelect={addPhoto} buttonLabel="Alege din bibliotecă" /></div>
            <div className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`} onDragOver={event => {
              if (event.dataTransfer.types.includes('Files')) { event.preventDefault(); if (!locked) setDragging(true) }
            }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }} onDrop={event => {
              event.preventDefault(); setDragging(false); void uploadFiles(Array.from(event.dataTransfer.files))
            }}>
              <FaUpload aria-hidden="true" /><label htmlFor="album-photos">{uploading ? 'Fotografiile se încarcă pe rând…' : 'Trage fotografiile aici sau alege din dispozitiv'}<input id="album-photos" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={locked || editor.photos.length >= 200} onChange={event => { void uploadFiles(Array.from(event.target.files || [])); event.target.value = '' }} /></label>
              <p>JPG, PNG, WebP · maximum 25 MB înainte de optimizare · cel mult 50 de fotografii odată.</p><p>Fotografiile sunt optimizate automat. Adăugarea în album se păstrează după salvare.</p>
            </div>
            {uploads.length > 0 && <div className={styles.uploadProgress}>
              <p role="status">{uploads.filter(item => item.status === 'done').length} / {uploads.length} fotografii încărcate{uploads.some(item => item.status === 'error') ? ` · ${uploads.filter(item => item.status === 'error').length} necesită reîncercare` : ''}</p>
              <progress value={uploads.filter(item => item.status === 'done' || item.status === 'error').length} max={uploads.length} aria-label="Progresul încărcării fotografiilor" />
              <ul>{uploads.map(item => <li key={item.id}><span className={styles.fileName}>{item.file.name}</span><span className={item.status === 'error' ? styles.fileError : ''}>{item.status === 'done' ? 'Încărcată ✓' : item.status === 'uploading' ? 'Se optimizează și se încarcă…' : item.status === 'waiting' ? 'În așteptare' : item.error}</span>{item.status === 'error' && <button type="button" disabled={locked} className={styles.smallButton} onClick={() => { void uploadEntries([item]) }}>Reîncearcă</button>}</li>)}</ul>
            </div>}
          </section>

          <section aria-labelledby="album-photos-heading" className={styles.photosSection}>
            <div className={styles.sectionHeading}><div><h3 id="album-photos-heading">Fotografiile albumului <span>{editor.photos.length}</span></h3><p className={styles.muted}>Alege o copertă și aranjează fotografiile prin tragere sau cu săgețile. {visiblePhotos.length} vizibile pe site.</p></div></div>
            {editor.photos.length ? <div className={styles.photoGrid}>
              {editor.photos.map((photo, index) => <article key={photo.url} className={`${styles.photoCard} ${photo.hidden ? styles.hiddenPhoto : ''}`} onDragOver={event => { if (draggedPhoto.current !== null) event.preventDefault() }} onDrop={event => { event.preventDefault(); if (draggedPhoto.current !== null) movePhoto(draggedPhoto.current, index); draggedPhoto.current = null }}>
                <div className={styles.photoImage}><Image src={photo.url} alt={photo.alt || `Fotografia ${index + 1}`} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 40vw, 25vw" /><span className={styles.photoNumber}>{index + 1}</span>{editor.coverImage === photo.url && <span className={styles.coverBadge}><FaCheck aria-hidden="true" /> Copertă</span>}{photo.hidden && <span className={styles.hiddenBadge}>Ascunsă</span>}</div>
                <fieldset disabled={locked} className={styles.photoBody}>
                  <div className={styles.photoTools}><button type="button" className={styles.dragHandle} draggable={!locked} onDragStart={event => { draggedPhoto.current = index; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)) }} onDragEnd={() => { draggedPhoto.current = null }} aria-label={`Trage fotografia ${index + 1} pentru rearanjare`} title="Trage pentru rearanjare"><FaGripVertical aria-hidden="true" /></button><button type="button" className={styles.iconButton} disabled={index === 0} onClick={() => movePhoto(index, index - 1)} aria-label={`Mută fotografia ${index + 1} mai sus`}><FaArrowUp aria-hidden="true" /></button><button type="button" className={styles.iconButton} disabled={index === editor.photos.length - 1} onClick={() => movePhoto(index, index + 1)} aria-label={`Mută fotografia ${index + 1} mai jos`}><FaArrowDown aria-hidden="true" /></button><button type="button" className={styles.removeButton} onClick={() => setPhotos(editor.photos.filter((_, position) => position !== index))} aria-label={`Elimină fotografia ${index + 1} din album`} title="Elimină din album"><FaTrash aria-hidden="true" /></button></div>
                  <button type="button" disabled={photo.hidden} className={editor.coverImage === photo.url ? styles.selectedCover : styles.coverButton} aria-pressed={editor.coverImage === photo.url} onClick={() => { setEditor(current => current && { ...current, coverImage: photo.url }); setNotice('') }}>{editor.coverImage === photo.url ? 'Coperta albumului' : 'Folosește drept copertă'}</button>
                  <label className={styles.visibility}><input type="checkbox" checked={!photo.hidden} onChange={event => setPhotos(editor.photos.map((item, position) => position === index ? { ...item, hidden: !event.target.checked } : item))} /> Vizibilă pe site</label>
                  <details className={styles.photoDetails}><summary>Descrierea fotografiei</summary><label htmlFor={`photo-alt-${index}`}>Text alternativ <span>pentru accesibilitate</span></label><input id={`photo-alt-${index}`} maxLength={240} value={photo.alt} onChange={event => setPhotos(editor.photos.map((item, position) => position === index ? { ...item, alt: event.target.value } : item))} className="mimesiss-input" placeholder="Descrie ce se vede în fotografie" /><label htmlFor={`photo-caption-${index}`}>Legendă <span>opțional</span></label><textarea id={`photo-caption-${index}`} rows={2} maxLength={500} value={photo.caption} onChange={event => setPhotos(editor.photos.map((item, position) => position === index ? { ...item, caption: event.target.value } : item))} className="mimesiss-input" placeholder="Un detaliu pentru vizitatori" /></details>
                </fieldset>
              </article>)}
            </div> : <div className={styles.emptyPhotos}><FaImages aria-hidden="true" /><p>Albumul așteaptă primele fotografii.</p><span>Încarcă mai multe odată sau alege din biblioteca foto.</span></div>}
          </section>
        </>}
        <footer className={styles.saveBar}>
          <div><p>{dirty ? 'Modificări nesalvate' : 'Album salvat'} · {visiblePhotos.length} {visiblePhotos.length === 1 ? 'fotografie vizibilă' : 'fotografii vizibile'}</p><span>{uploading ? 'Așteaptă finalizarea încărcărilor înainte de salvare.' : 'Fotografiile ascunse apar doar în administrare.'}</span></div>
          <div className={styles.saveActions}><button type="button" disabled={locked} className={styles.secondary} onClick={() => { void save('draft') }}>{busy ? 'Se salvează…' : editor.status === 'published' ? 'Retrage la ciornă' : 'Salvează ciorna'}</button><button type="button" disabled={locked} className={styles.primary} onClick={() => { void save('published') }}>{editor.status === 'published' ? 'Salvează modificările' : 'Publică albumul'}</button></div>
        </footer>
        <div className={styles.deleteRow}><p>Eliminarea albumului păstrează fotografiile în bibliotecă.</p><button type="button" className={styles.deleteButton} disabled={locked} onClick={() => { void deleteAlbum() }}><FaTrash aria-hidden="true" /> Elimină albumul</button></div>
      </div>}
    </div>
  </div>
}

'use client'

import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { FaArrowLeft, FaArrowRight, FaTimes } from 'react-icons/fa'
import { LEGACY_ALBUM, type GalleryPhoto } from '@/lib/gallery-types'
import styles from './Gallery.module.css'

export default function EventGallery({ photos = LEGACY_ALBUM.photos, title = 'Galerie MIMESISS' }: {
  photos?: GalleryPhoto[]
  title?: string
}) {
  const visible = photos.filter(photo => !photo.hidden)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const [selected, setSelected] = useState(0)
  const [open, setOpen] = useState(false)
  const headingId = useId()
  const captionId = useId()
  const current = visible[selected]

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [open])

  function close() { dialog.current?.close() }
  function move(step: number) { setSelected(index => (index + step + visible.length) % visible.length) }

  if (!visible.length) return <p className={styles.empty}>Fotografiile acestui album vor apărea în curând.</p>

  return <>
    <div className={styles.photoGrid}>
      {visible.map((photo, index) => <figure key={photo.url} className={styles.photoTile}>
        <button type="button" className={styles.photoButton} aria-label={`Deschide fotografia ${index + 1}: ${photo.alt}`} onClick={event => {
          opener.current = event.currentTarget
          setSelected(index)
          setOpen(true)
          dialog.current?.showModal()
        }}>
          <Image src={photo.url} alt={photo.alt || `${title} — fotografia ${index + 1}`} width={720} height={540} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className={styles.photo} />
        </button>
        {photo.caption && <figcaption className={styles.tileCaption}>{photo.caption}</figcaption>}
      </figure>)}
    </div>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={headingId} aria-describedby={current?.caption ? captionId : undefined} onClose={() => {
      setOpen(false)
      opener.current?.focus()
    }} onClick={event => { if (event.target === event.currentTarget) close() }} onKeyDown={event => {
      if (event.key === 'ArrowRight') { event.preventDefault(); move(1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1) }
    }}>
      <div className={styles.dialogHeader}>
        <h2 id={headingId}>{title}</h2>
        <button type="button" autoFocus onClick={close} className={styles.iconButton} aria-label="Închide fotografia"><FaTimes aria-hidden="true" /></button>
      </div>
      {open && current && <div className={styles.dialogImage}><Image src={current.url} alt={current.alt || `${title} — fotografia ${selected + 1}`} fill sizes="(max-width: 1100px) 92vw, 1050px" className={styles.fullPhoto} /></div>}
      <div className={styles.controls}>
        <button type="button" onClick={() => move(-1)} disabled={visible.length < 2}><FaArrowLeft aria-hidden="true" /> Înapoi</button>
        <span aria-live="polite" aria-atomic="true">{selected + 1} / {visible.length}</span>
        <button type="button" onClick={() => move(1)} disabled={visible.length < 2}>Înainte <FaArrowRight aria-hidden="true" /></button>
      </div>
      {current?.caption && <p id={captionId} className={styles.dialogCaption}>{current.caption}</p>}
    </dialog>
  </>
}

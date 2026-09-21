'use client'
import Image from 'next/image'
import { useRef, useState } from 'react'
const photos = Array.from({length:12}, (_,i) => `/old/${i+1}.jpeg`)
export default function EventGallery() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [selected, setSelected] = useState(0)
  const move = (step:number) => setSelected(index => (index + step + photos.length) % photos.length)
  return <><div className="gallery-grid">{photos.map((src,index) => <button type="button" key={src} aria-label={`Deschide fotografia ${index+1}`} onClick={() => {setSelected(index); dialog.current?.showModal()}}><Image src={src} alt={`Activități MIMESISS — fotografia ${index+1}`} width={600} height={400} sizes="(max-width:760px) 100vw, 33vw" /></button>)}</div><dialog ref={dialog} className="gallery-dialog" aria-label="Galerie MIMESISS" onKeyDown={event => {if(event.key === 'ArrowRight') move(1); if(event.key === 'ArrowLeft') move(-1)}}><Image src={photos[selected]} alt={`Activități MIMESISS — fotografia ${selected+1}`} width={1200} height={900} /><div className="gallery-controls"><button type="button" onClick={() => move(-1)}>Înapoi</button><span>{selected+1} / {photos.length}</span><button type="button" onClick={() => move(1)}>Înainte</button><button type="button" onClick={() => dialog.current?.close()}>Închide</button></div></dialog></>
}

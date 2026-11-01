import Link from 'next/link'
import { notFound } from 'next/navigation'
import EventGallery from '@/components/asociatie/EventGallery'
import HeaderContent from '@/components/ui/HeaderContent'
import { getPublishedAlbum } from '@/lib/gallery'
import styles from '@/components/asociatie/Gallery.module.css'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const album = await getPublishedAlbum(id)
  return { title: album ? `${album.title} · Galerie MIMESISS` : 'Album indisponibil' }
}

export default async function Page({ params }: Props) {
  const { id } = await params
  const album = await getPublishedAlbum(id)
  if (!album) notFound()

  return <>
    <HeaderContent title={album.title} kicker={album.editionYear ? `MIMESISS · Ediția ${album.editionYear}` : album.legacy ? 'MIMESISS · Arhivă foto' : 'MIMESISS · Galerie foto'} />
    <div className="public-page">
      <Link href="/congres/gallery" className="public-link mb-8">← Toate albumele</Link>
      <div className={styles.albumMeta}><span>{album.photos.length} {album.photos.length === 1 ? 'fotografie' : 'fotografii'}</span>{album.editionYear && <span>Ediția {album.editionYear}</span>}</div>
      {album.description && <p className="public-intro whitespace-pre-line break-words">{album.description}</p>}
      <EventGallery photos={album.photos} title={album.title} />
    </div>
  </>
}

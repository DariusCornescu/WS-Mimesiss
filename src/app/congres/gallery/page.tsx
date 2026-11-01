import Image from 'next/image'
import Link from 'next/link'
import HeaderContent from '@/components/ui/HeaderContent'
import { getPublishedAlbums } from '@/lib/gallery'
import styles from '@/components/asociatie/Gallery.module.css'

export const metadata = { title: 'Galerie foto MIMESISS' }

export default async function Page() {
  const albums = await getPublishedAlbums()

  return <>
    <HeaderContent title="Oameni. Experiențe. Amintiri." kicker="MIMESISS · Galerie" />
    <div className="public-page">
      <p className="public-intro">Momente din activitățile MIMESISS: de la primele manevre practice la întâlnirile care ne aduc împreună. Descoperă poveștile noastre, album cu album.</p>
      {albums.length ? <div className={styles.albumGrid}>
        {albums.map(album => <article key={album.id} className={styles.album}>
          <Link href={`/congres/gallery/${album.id}`} className={styles.albumLink}>
            <div className={styles.cover}>{album.coverImage && <Image src={album.coverImage} alt="" fill sizes="(max-width: 760px) 100vw, (max-width: 1024px) 50vw, 33vw" />}</div>
            <div className={styles.albumCopy}>
              <p className={styles.kicker}>{album.editionYear ? `Ediția ${album.editionYear}` : album.legacy ? 'Din arhiva MIMESISS' : 'Album MIMESISS'} · {album.photos.length} {album.photos.length === 1 ? 'fotografie' : 'fotografii'}</p>
              <h2>{album.title}</h2>
              {album.description && <p className={`${styles.summary} line-clamp-3`}>{album.description}</p>}
              <span className={styles.readMore}>Deschide albumul →</span>
            </div>
          </Link>
        </article>)}
      </div> : <p className={styles.empty}>Pregătim primele albume. Revino în curând pentru fotografii din comunitatea MIMESISS.</p>}
    </div>
  </>
}

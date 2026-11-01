import { notFound } from 'next/navigation'
import GalleryManager from '@/components/admin/GalleryManager'
import AccountLayout from '@/components/dashboard/AccountLayout'
import { LEGACY_ALBUM, type GalleryAlbum } from '@/lib/gallery-types'

export default function GalleryCheck() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const album: GalleryAlbum = { id: '0123456789abcdef01234567', title: 'MIMESISS 2025 · Momente din congres', description: 'Conferințe, workshopuri și întâlniri care ne-au adus împreună.', editionYear: 2025,
    status: 'draft', coverImage: '/old/3.jpeg', photos: LEGACY_ALBUM.photos.slice(0, 4).map((photo, i) => ({ ...photo, caption: i === 0 ? 'Workshopuri practice alături de echipa MIMESISS.' : '', hidden: i === 3 })), revision: 0, updatedAt: '' }
  return <AccountLayout user={{ email: 'editor@example.invalid', firstName: 'Editor', lastName: 'ASMM', role: 'admin' }}><GalleryManager albums={[album, LEGACY_ALBUM]} /></AccountLayout>
}

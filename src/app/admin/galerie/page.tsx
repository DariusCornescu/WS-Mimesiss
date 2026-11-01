import GalleryManager from '@/components/admin/GalleryManager'
import { requireRoleOrRedirect } from '@/lib/auth'
import { getAdminAlbums } from '@/lib/gallery'

export const metadata = { title: 'Administrare galerie MIMESISS' }

export default async function AdminGalleryPage() {
  await requireRoleOrRedirect('admin')
  const albums = await getAdminAlbums()
  return <GalleryManager albums={albums} />
}

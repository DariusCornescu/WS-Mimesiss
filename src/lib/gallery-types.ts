export type GalleryPhoto = {
  url: string
  alt: string
  caption: string
  hidden: boolean
}

export type GalleryAlbum = {
  id: string
  title: string
  description: string
  editionYear: number | null
  status: 'draft' | 'published'
  coverImage: string
  photos: GalleryPhoto[]
  revision: number
  updatedAt: string
  legacy?: boolean
}

export type LibraryPhoto = { url: string; name: string; createdAt: string }

export const LEGACY_ALBUM: GalleryAlbum = {
  id: 'archive',
  title: 'Arhivă MIMESISS',
  description: 'Momente din activitățile MIMESISS, păstrate din galeria existentă.',
  editionYear: null,
  status: 'published',
  coverImage: '/old/3.jpeg',
  photos: Array.from({ length: 12 }, (_, i) => ({
    url: `/old/${i + 1}.jpeg`, alt: `Activități MIMESISS — fotografia ${i + 1}`, caption: '', hidden: false,
  })),
  revision: 0,
  updatedAt: '',
  legacy: true,
}

'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import PhotoGrid from '@/components/ui/PhotoGrid'
import { viewerPhotos, type GalleryPhoto } from '@/lib/photo-viewer'

const PhotoViewer = dynamic(() => import('@/components/ui/PhotoViewer'), { ssr: false })

export default function ProjectGallery({ photos, title }: { photos: GalleryPhoto[]; title: string }) {
  const [photo, setPhoto] = useState<GalleryPhoto | null>(null)
  const viewer = photo ? viewerPhotos(photos, photo) : null
  return <>
    <PhotoGrid photos={photos} onSelect={item => setPhoto(item)} />
    {viewer && <PhotoViewer photos={viewer.photos} index={viewer.index} title={title} onClose={() => setPhoto(null)} />}
  </>
}

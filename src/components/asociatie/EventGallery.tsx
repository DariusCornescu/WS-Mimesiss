'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import PhotoGrid from '@/components/ui/PhotoGrid'
const PhotoViewer = dynamic(() => import('@/components/ui/PhotoViewer'), { ssr: false })
const photos = [
  {
    "src": "/old/1.jpeg",
    "alt": "Activități MIMESISS — fotografia 1",
    "width": 790,
    "height": 1053
  },
  {
    "src": "/old/2.jpeg",
    "alt": "Activități MIMESISS — fotografia 2",
    "width": 1284,
    "height": 915
  },
  {
    "src": "/old/3.jpeg",
    "alt": "Activități MIMESISS — fotografia 3",
    "width": 1600,
    "height": 1067
  },
  {
    "src": "/old/4.jpeg",
    "alt": "Activități MIMESISS — fotografia 4",
    "width": 791,
    "height": 1055
  },
  {
    "src": "/old/5.jpeg",
    "alt": "Activități MIMESISS — fotografia 5",
    "width": 377,
    "height": 503
  },
  {
    "src": "/old/6.jpeg",
    "alt": "Activități MIMESISS — fotografia 6",
    "width": 1203,
    "height": 808
  },
  {
    "src": "/old/7.jpeg",
    "alt": "Activități MIMESISS — fotografia 7",
    "width": 1200,
    "height": 1600
  },
  {
    "src": "/old/8.jpeg",
    "alt": "Activități MIMESISS — fotografia 8",
    "width": 1122,
    "height": 1496
  },
  {
    "src": "/old/9.jpeg",
    "alt": "Activități MIMESISS — fotografia 9",
    "width": 790,
    "height": 1054
  },
  {
    "src": "/old/10.jpeg",
    "alt": "Activități MIMESISS — fotografia 10",
    "width": 888,
    "height": 1184
  },
  {
    "src": "/old/11.jpeg",
    "alt": "Activități MIMESISS — fotografia 11",
    "width": 872,
    "height": 1162
  },
  {
    "src": "/old/12.jpeg",
    "alt": "Activități MIMESISS — fotografia 12",
    "width": 872,
    "height": 1162
  }
]

export default function EventGallery() {
  const [index, setIndex] = useState<number | null>(null)
  return <><PhotoGrid photos={photos} prioritizeFirst onSelect={(_, selected) => setIndex(selected)} />{index !== null && <PhotoViewer photos={photos} index={index} title="Galerie MIMESISS" onClose={() => setIndex(null)} />}</>
}

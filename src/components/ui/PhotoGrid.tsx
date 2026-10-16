'use client'

import Image from 'next/image'
import { FiMaximize2 } from 'react-icons/fi'
import type { GalleryPhoto } from '@/lib/photo-viewer'
import styles from './PhotoGrid.module.css'

export default function PhotoGrid({ photos, onSelect }: { photos: GalleryPhoto[]; onSelect: (photo: GalleryPhoto, index: number) => void }) {
  return <div className={styles.grid}>{photos.map((photo, index) => <button key={photo.src} type="button" onClick={() => onSelect(photo, index)} aria-label={'Mărește fotografia: '+photo.alt}>
    <Image loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} src={photo.src} alt={photo.alt} width={photo.width ?? 1200} height={photo.height ?? 900} sizes="(max-width: 700px) calc((100vw - 44px) / 2), 33vw" />
    <span aria-hidden="true"><FiMaximize2 /></span>
  </button>)}</div>
}

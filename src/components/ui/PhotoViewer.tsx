'use client'

import { useMemo } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Counter from 'yet-another-react-lightbox/plugins/counter'
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import { FiChevronLeft, FiChevronRight, FiX, FiZoomIn, FiZoomOut } from 'react-icons/fi'
import { photoSlides, type GalleryPhoto } from '@/lib/photo-viewer'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/counter.css'
import 'yet-another-react-lightbox/plugins/thumbnails.css'
import styles from './PhotoViewer.module.css'

export default function PhotoViewer({ photos, index, onClose, title }: { photos: GalleryPhoto[]; index: number; onClose: () => void; title: string }) {
  const slides = useMemo(() => photoSlides(photos), [photos])
  return <Lightbox open close={onClose} index={index} slides={slides} className={styles.viewer}
    plugins={photos.length > 1 ? [Counter, Thumbnails, Zoom] : [Zoom]}
    labels={{ Lightbox: title, 'Photo gallery': 'Galerie foto', Thumbnails: 'Miniaturi', Slide: 'Fotografie', Carousel: 'Carusel', Close: 'Închide fotografia', Next: 'Fotografia următoare', Previous: 'Fotografia anterioară', 'Zoom in': 'Mărește', 'Zoom out': 'Micșorează', 'Show thumbnails': 'Arată miniaturile', 'Hide thumbnails': 'Ascunde miniaturile', '{index} of {total}': 'Fotografia {index} din {total}' }}
    portal={{ container: { 'aria-label': title } }}
    controller={{ aria: true, closeOnPullDown: true, closeOnBackdropClick: true }}
    carousel={{ preload: 1, imageFit: 'contain', padding: 0 }}
    thumbnails={{ width: 64, height: 52, gap: 8, padding: 2, border: 1, imageFit: 'contain' }}
    counter={{ container: { 'aria-live': 'polite' } }}
    render={{ iconLoading: () => <span role="status">Se încarcă fotografia…</span>, iconError: () => <span role="alert">Fotografia nu a putut fi încărcată.</span>, iconClose: () => <FiX />, iconPrev: () => <FiChevronLeft />, iconNext: () => <FiChevronRight />, iconZoomIn: () => <FiZoomIn />, iconZoomOut: () => <FiZoomOut /> }}
  />
}

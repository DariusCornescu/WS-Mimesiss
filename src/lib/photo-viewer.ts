export type GalleryPhoto = { src: string; alt: string; width?: number; height?: number }

const imageUrl = (src: string, width: number) => '/_next/image?url=' + encodeURIComponent(src) + '&w=' + width + '&q=85'
const widths = [384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]

export function viewerPhotos(photos: GalleryPhoto[], selected: GalleryPhoto) {
  const index = photos.findIndex(photo => photo.src === selected.src)
  return index >= 0 ? { photos, index } : { photos: [selected], index: 0 }
}

export function photoSlides(photos: GalleryPhoto[]) {
  return photos.map(photo => {
    const { width, height } = photo
    const srcSet = width && height ? [
      ...widths.filter(size => size < width).map(size => ({ src: imageUrl(photo.src, size), width: size, height: Math.round(size * height / width) })),
      { src: photo.src, width, height },
    ] : undefined
    return { ...photo, thumbnail: imageUrl(photo.src, 128), ...(srcSet ? { srcSet } : {}) }
  })
}

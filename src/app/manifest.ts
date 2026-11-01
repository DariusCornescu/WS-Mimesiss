import type { MetadataRoute } from 'next'
import { BRAND } from '@/lib/brand'
import manifest from '../../public/manifest.json'

export default function webManifest(): MetadataRoute.Manifest {
  return {
    ...manifest,
    background_color: BRAND.background,
    theme_color: BRAND.primary,
  } as MetadataRoute.Manifest
}

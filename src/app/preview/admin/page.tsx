import { notFound } from 'next/navigation'
import AdminPreview from '@/components/admin/AdminPreview'

export const metadata = {
  title: 'Previzualizare administrare',
  robots: { index: false, follow: false },
}

export default function AdminPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <AdminPreview />
}

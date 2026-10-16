import { notFound } from 'next/navigation'
import TentStoryForm from '@/components/admin/TentStoryForm'
import { emptyTentStoryCopy } from '@/lib/tent-story-copy'

export const metadata = { title: 'Previzualizare texte Cortul IMM', robots: { index: false, follow: false } }
export default function TentCopyPreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <div className="max-w-4xl mx-auto p-6 space-y-6"><p role="status">Previzualizare · Salvarea este dezactivată.</p><h1 className="text-3xl font-bold">Texte pentru Cortul IMM</h1><TentStoryForm initialCopy={emptyTentStoryCopy()} preview /></div>
}

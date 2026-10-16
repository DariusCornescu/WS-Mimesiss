import { unstable_cache } from 'next/cache'
import connectDB from '@/lib/mongodb'
import { ProjectStoryContent } from '@/models/ProjectStoryContent'
import { editableStoryKeys, isEditableStorySlug, type EditableStorySlug, type ProjectStoryCopy } from './project-story-copy'
import { defaultProjectCopy } from './project-story-defaults'
import type { StoryCopy } from './tent-story-copy'

export const projectStoryTag = (slug: EditableStorySlug) => 'project-story-copy-' + slug
export async function readProjectStoryCopy(slug: EditableStorySlug): Promise<ProjectStoryCopy> {
  if (!isEditableStorySlug(slug)) throw new Error('Proiect negăsit.')
  await connectDB()
  const document = await ProjectStoryContent.findOne({ slug }).select('sections -_id').lean<{ sections: (StoryCopy & { key: string })[] }>()
  const copy = defaultProjectCopy(slug)
  for (const key of editableStoryKeys[slug]) {
    const section = document?.sections?.find(item => item.key === key)
    if (section) copy[key] = { title: section.title || '', body: section.body || '' }
  }
  return copy
}
// Public title and description only; independent keys and tags per project, expired on admin save.
const readers = {
  mimesiss: unstable_cache(() => readProjectStoryCopy('mimesiss'), ['project-story-copy-mimesiss-v2'], { tags: [projectStoryTag('mimesiss')], revalidate: 300 }),
  'balul-bobocilor': unstable_cache(() => readProjectStoryCopy('balul-bobocilor'), ['project-story-copy-balul-bobocilor'], { tags: [projectStoryTag('balul-bobocilor')], revalidate: 300 }),
}
export function getProjectStoryCopy(slug: EditableStorySlug) { return readers[slug]() }

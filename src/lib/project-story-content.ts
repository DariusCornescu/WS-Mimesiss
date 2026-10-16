import { unstable_cache } from 'next/cache'
import connectDB from '@/lib/mongodb'
import { ProjectStoryContent } from '@/models/ProjectStoryContent'
import { emptyTentStoryCopy, tentSceneKeys, type StoryCopy, type TentStoryCopy } from '@/lib/tent-story-copy'

export const tentStoryTag = 'tent-story-copy'
export async function readTentStoryCopy(): Promise<TentStoryCopy> {
  await connectDB()
  const document = await ProjectStoryContent.findOne({ slug: 'cortul-imm' }).select('sections -_id').lean<{ sections: (StoryCopy & { key: string })[] }>()
  const copy = emptyTentStoryCopy()
  for (const key of tentSceneKeys) {
    const section = document?.sections?.find(item => item.key === key)
    if (section) copy[key] = { title: section.title || '', body: section.body || '' }
  }
  return copy
}
/** Public text only; fixed Cortul IMM key, five-minute expiry, expired by the admin save action. Database errors propagate rather than caching empty text on failure. */
export const getTentStoryCopy = unstable_cache(readTentStoryCopy, ['tent-story-copy'], { tags: [tentStoryTag], revalidate: 300 })

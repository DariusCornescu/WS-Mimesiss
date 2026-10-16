import { storyCopyPassages, type StoryCopy } from '@/lib/tent-story-copy'

export function neuralStoryPassages(copy: StoryCopy, compact: boolean): StoryCopy[] {
  return storyCopyPassages(copy.body, compact ? copy.title : false, compact ? 260 : 600).map((body, index) => ({ title: index === 0 ? copy.title : '', body }))
}

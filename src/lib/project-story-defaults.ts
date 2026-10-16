import { projects, statement } from '@/components/project-stories/lib/content'
import { mimesissScenePhotos } from '@/components/project-stories/lib/mimesiss-scene'
import { getEventStory } from '@/components/project-stories/lib/event-stories'
import { editableStoryKeys, type EditableStorySlug, type ProjectStoryCopy } from './project-story-copy'

const congress = projects.find(item => item.id === 'mimesiss')!
const conference = congress.sections?.find(section => section.title === 'Conferințe')
const sentences = conference?.description.split(/(?<=\.)\s+/) ?? congress.description
export const mimesissChapters = [
  { label: 'Conferințe', title: conference?.subtitle ?? 'Idei care deschid noi perspective', body: sentences[0] },
  { label: 'Participanți', title: '', body: congress.description[1] + ' Schimbul de idei și experiențele comune întăresc comunitatea ASMM.' },
  { label: 'Perspective', title: '', body: sentences.slice(1).join(' ') },
  { label: 'Împreună', title: '', body: statement },
]
export function storyEditorScenes(slug: EditableStorySlug) {
  if (slug === 'mimesiss') {
    const workshop = congress.sections!.find(section => section.title === 'Workshopuri')!
    return [...mimesissChapters.map((chapter, index) => ({ ...chapter, photo: mimesissScenePhotos[index], key: editableStoryKeys.mimesiss[index] })), { key: 'workshopuri', label: workshop.title, title: workshop.subtitle, body: workshop.description, photo: { src: workshop.image, alt: workshop.imageAlt } }]
  }
  return getEventStory(projects.find(item => item.id === 'bal')!).chapters.map((chapter, index) => ({ ...chapter, key: editableStoryKeys['balul-bobocilor'][index] }))
}
export function defaultProjectCopy(slug: EditableStorySlug): ProjectStoryCopy {
  return Object.fromEntries(storyEditorScenes(slug).map(({ key, title, body }) => [key, { title, body }]))
}

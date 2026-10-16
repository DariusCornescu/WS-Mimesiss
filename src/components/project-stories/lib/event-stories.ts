import { tentSceneKeys, type TentStoryCopy } from '@/lib/tent-story-copy'
import type { StoryProject } from './content'

export type StoryPhoto = { src: string; alt: string; position: string; width: number; height: number }
export type StoryChapter = { label: string; title: string; body: string; photo: StoryPhoto }
export type EventStory = {
  id: 'bal' | 'cort'
  title: string
  eyebrow: string
  subtitle: string
  intro: StoryPhoto
  chapters: StoryChapter[]
}

export const tentStoryPhotos: StoryPhoto[] = [
  { src: '/project-stories/Poza_5.1.webp', alt: 'Prezentarea unei investigații imagistice la Cortul IMM, într-o ramă de album cu foi suprapuse.', position: '50% 50%', width: 1080, height: 1350 },
  { src: '/project-stories/Poza_5.2.webp', alt: 'Demonstrație de prim ajutor la Cortul IMM, într-o ramă de album cu foi suprapuse.', position: '50% 50%', width: 1080, height: 1350 },
  { src: '/project-stories/Poza_5.3.webp', alt: 'Exersarea resuscitării pe un manechin la Cortul IMM, într-o ramă de album cu foi suprapuse.', position: '50% 50%', width: 1080, height: 1350 },
]

export function getEventStory(project: StoryProject, copy?: TentStoryCopy): EventStory {
  if (project.id === 'bal') {
    const photo = (index: number, position = '50% 45%'): StoryPhoto => ({ ...project.gallery[index], position, width: 2400, height: 1600 })
    return {
      id: 'bal', title: project.title, eyebrow: project.kicker, subtitle: project.subtitle,
      intro: photo(4, '50% 42%'),
      chapters: [
        { label: 'Muzică', title: '', body: '', photo: photo(0, '50% 43%') },
        { label: 'Dans', title: '', body: '', photo: photo(3, '50% 44%') },
        { label: 'Spectacol', title: '', body: '', photo: photo(2, '50% 42%') },
        { label: 'Împreună', title: '', body: project.description[2], photo: photo(4, '50% 42%') },
      ],
    }
  }
  return {
    id: 'cort', title: 'Cortul IMM', eyebrow: 'La Simularea Admiterii UMFCD', subtitle: project.subtitle,
    intro: { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-29-3-jpg-20a4e92.webp', alt: 'Echipa Institutului Medico Militar în fața cortului.', position: '50% 46%', width: 2048, height: 1536 },
    chapters: [
      { label: 'Descoperă', title: '', body: '', photo: tentStoryPhotos[0] },
      { label: 'Primul ajutor', title: '', body: '', photo: tentStoryPhotos[1] },
      { label: 'Exersează', title: '', body: '', photo: tentStoryPhotos[2] },
    ].map((chapter, index) => ({ ...chapter, ...copy?.[tentSceneKeys[index]] })),
  }
}

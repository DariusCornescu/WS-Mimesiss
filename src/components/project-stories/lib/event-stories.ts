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
  { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-28-2-jpg-0433dbb.webp', alt: 'Vizitatori și studenți militari în fața cortului IMM.', position: '50% 58%', width: 1536, height: 2048 },
  { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-32-3-jpg-3d9a5ab.webp', alt: 'Un student militar explică o investigație imagistică vizitatorilor.', position: '50% 57%', width: 1536, height: 2048 },
  { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-31-7-jpg-26254a9.webp', alt: 'Exersarea primului ajutor pe un manechin, în interiorul cortului IMM.', position: '50% 53%', width: 1536, height: 2048 },
  { src: '/project-stories/originals/tent/photo-2026-10-10-10-44-31-8-jpg-8f5e803.webp', alt: 'O studentă militară discută cu vizitatorii lângă cortul IMM.', position: '50% 55%', width: 1536, height: 2048 },
]

export function getEventStory(project: StoryProject): EventStory {
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
      { label: 'Bun venit', title: '', body: '', photo: tentStoryPhotos[0] },
      { label: 'Descoperă', title: '', body: '', photo: tentStoryPhotos[1] },
      { label: 'Încearcă', title: '', body: '', photo: tentStoryPhotos[2] },
      { label: 'Întreabă', title: '', body: '', photo: tentStoryPhotos[3] },
    ],
  }
}

import { tentCopyLimits, TentCopyValidationError, type StoryCopy } from './tent-story-copy'

export const editableStoryKeys = {
  mimesiss: ['conferinte', 'participanti', 'perspective', 'impreuna', 'workshopuri'],
  'balul-bobocilor': ['muzica', 'dans', 'spectacol', 'impreuna'],
} as const
export type EditableStorySlug = keyof typeof editableStoryKeys
export type ProjectStoryCopy = Record<string, StoryCopy>
export function isEditableStorySlug(value: string): value is EditableStorySlug {
  return Object.hasOwn(editableStoryKeys, value)
}
export function readProjectCopy(slug: EditableStorySlug, form: FormData): ProjectStoryCopy {
  const copy: ProjectStoryCopy = {}
  for (const key of editableStoryKeys[slug]) {
    const section: StoryCopy = { title: '', body: '' }
    for (const field of ['title', 'body'] as const) {
      const values = form.getAll(key + '.' + field)
      if (values.length !== 1 || typeof values[0] !== 'string') throw new TentCopyValidationError('Textul trimis nu este valid.')
      const text = values[0].trim()
      if (text.length > tentCopyLimits[field]) throw new TentCopyValidationError(field === 'title' ? 'Titlul poate avea cel mult 80 de caractere.' : 'Descrierea poate avea cel mult 1200 de caractere.')
      section[field] = text
    }
    copy[key] = section
  }
  return copy
}

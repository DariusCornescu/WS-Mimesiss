export const tentSceneKeys = ['imagistica', 'prim-ajutor', 'resuscitare'] as const
export type TentSceneKey = typeof tentSceneKeys[number]
export type StoryCopy = { title: string; body: string }
export type TentStoryCopy = Record<TentSceneKey, StoryCopy>
export const tentCopyLimits = { title: 80, body: 1200 }

export function emptyTentStoryCopy(): TentStoryCopy {
  return { imagistica: { title: '', body: '' }, 'prim-ajutor': { title: '', body: '' }, resuscitare: { title: '', body: '' } }
}

export class TentCopyValidationError extends Error {}

export function readTentCopy(form: FormData): TentStoryCopy {
  const copy = emptyTentStoryCopy()
  for (const key of tentSceneKeys) {
    for (const field of ['title', 'body'] as const) {
      const name = key + '.' + field
      if (!form.has(name) || form.getAll(name).length !== 1) throw new TentCopyValidationError('Textul trimis nu este valid.')
      const value = form.get(name)
      if (value !== null && typeof value !== 'string') throw new TentCopyValidationError('Textul trimis nu este valid.')
      const text = typeof value === 'string' ? value.trim() : ''
      if (text.length > tentCopyLimits[field]) throw new Error(field === 'title' ? 'Titlul poate avea cel mult 80 de caractere.' : 'Descrierea poate avea cel mult 1200 de caractere.')
      copy[key][field] = text
    }
  }
  return copy
}

export function storyCopyPassages(body: string, hasTitle: boolean | string, maxLength = 220): string[] {
  if (!body.trim()) return ['']
  const passages: string[] = []
  let remaining = body.trim()
  while (remaining) {
    const firstLimit = typeof hasTitle === 'string' && hasTitle.length <= 50 ? 180 : 120
    const limit = passages.length === 0 && hasTitle ? Math.min(firstLimit, maxLength) : maxLength
    if (remaining.length <= limit) { passages.push(remaining); break }
    const target = remaining.length - limit < 60 ? Math.ceil(remaining.length / 2) : limit
    let end = remaining.lastIndexOf(' ', target)
    if (end < target / 2) end = target
    passages.push(remaining.slice(0, end).trim())
    remaining = remaining.slice(end).trim()
  }
  return passages
}

export function compactStoryPassages(body: string, title: string): StoryCopy[] {
  if (title && title.length + body.length > 160) return [
    { title, body: '' },
    ...storyCopyPassages(body, false, 180).map(body => ({ title: '', body })),
  ]
  return storyCopyPassages(body, title, 180).map((body, part) => ({ title: part === 0 ? title : '', body }))
}

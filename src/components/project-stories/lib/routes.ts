import type { ProjectId } from './content'

export const storyRoutes: Record<ProjectId, string> = {
  mimesiss: '/proiecte/mimesiss',
  bal: '/proiecte/balul-bobocilor',
  cort: '/proiecte/cortul-imm',
}

export function storyIdForSlug(slug: string): ProjectId | undefined {
  return (Object.keys(storyRoutes) as ProjectId[]).find(id => storyRoutes[id] === `/proiecte/${slug}`)
}

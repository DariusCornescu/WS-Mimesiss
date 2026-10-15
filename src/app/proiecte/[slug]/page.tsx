import { notFound, redirect } from 'next/navigation'
import { ProjectDetail } from '@/components/asociatie/ProjectPages'
import { getProjectBySlug } from '@/lib/projects'
import ProjectStoryPage from '@/components/project-stories/ProjectStoryPage'
import { projects } from '@/components/project-stories/lib/content'
import { storyIdForSlug, storyRoutes } from '@/components/project-stories/lib/routes'
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }) {
  const slug = (await params).slug
  const story = projects.find(project => project.id === storyIdForSlug(slug))
  if (story) return { title: story.title, description: story.description[0], alternates: { canonical: storyRoutes[story.id] } }
  const project = await getProjectBySlug(slug)
  return {title: project?.title || 'Proiect negăsit', description: project?.summary}
}
export default async function Page({ params }: {params:Promise<{slug:string}>}) {
  const slug = (await params).slug
  const storyId = storyIdForSlug(slug)
  if (storyId) return <ProjectStoryPage projectId={storyId} />
  const project = await getProjectBySlug(slug)
  if (!project) notFound()
  if (project.kind === 'congress') redirect('/congres')
  return <ProjectDetail project={project} />
}

import { notFound, redirect } from 'next/navigation'
import { ProjectDetail } from '@/components/asociatie/ProjectPages'
import { getProjectBySlug } from '@/lib/projects'
export async function generateMetadata({ params }: { params: Promise<{slug:string}> }) { const project = await getProjectBySlug((await params).slug); return {title: project?.title || 'Proiect negăsit', description: project?.summary} }
export default async function Page({ params }: {params:Promise<{slug:string}>}) {
  const project = await getProjectBySlug((await params).slug)
  if (!project) notFound()
  if (project.kind === 'congress') redirect('/congres')
  return <ProjectDetail project={project} />
}

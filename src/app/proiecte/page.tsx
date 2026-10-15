import { ProjectListing } from '@/components/asociatie/ProjectPages'
import { getPublishedProjects } from '@/lib/projects'
import ProjectStoryPage from '@/components/project-stories/ProjectStoryPage'
import { storyIdForSlug } from '@/components/project-stories/lib/routes'
export const metadata = { title: 'Proiecte', description: 'Proiectele Asociației Studenților în Medicină Militară.' }
export default async function Page() {
  const otherProjects = (await getPublishedProjects()).filter(project => project.kind !== 'congress' && !storyIdForSlug(project.slug))
  return <><ProjectStoryPage projectId="mimesiss" />{otherProjects.length > 0 && <ProjectListing projects={otherProjects} />}</>
}

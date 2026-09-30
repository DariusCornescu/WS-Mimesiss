import { ProjectListing } from '@/components/asociatie/ProjectPages'
import { getPublishedProjects } from '@/lib/projects'
export const metadata = { title: 'Proiecte', description: 'Proiectele Asociației Studenților în Medicină Militară.' }
export default async function Page() { return <ProjectListing projects={await getPublishedProjects()} /> }

import { ProjectListing } from '@/components/asociatie/ProjectPages'
import { getPublishedProjects } from '@/lib/projects'
export const metadata = { title: 'Proiecte', description: 'Proiectele Asociației Studenților Mediciniști Militari.' }
export default async function Page() { return <ProjectListing projects={await getPublishedProjects()} /> }

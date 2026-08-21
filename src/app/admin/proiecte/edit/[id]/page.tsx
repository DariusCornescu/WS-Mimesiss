import { currentUser } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'

import ProjectForm from '@/components/admin/ProjectForm'
import { syncUserWithDatabase } from '@/lib/auth'
import { getProjectById, updateProject } from '../../actions'

export default async function AdminProiectEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  const { id } = await params
  const project = await getProjectById(id)

  if (!project) notFound()

  // Leagă id-ul de acțiune, ca formularul să rămână acelaşi ca la creare.
  const action = updateProject.bind(null, id)

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
        <p className="mt-2 font-mono text-sm text-muted-foreground">/proiecte/{project.slug}</p>
      </div>

      <ProjectForm action={action} project={project} submitLabel="Salvează modificările" />
    </div>
  )
}

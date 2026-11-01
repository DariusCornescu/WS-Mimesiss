import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

import ProjectForm from '@/components/admin/ProjectForm'
import PageIntro from '@/components/ui/PageIntro'
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
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare · Proiecte"
        title="Editează postarea"
        description={(
          <span>
            Actualizezi <strong className="font-semibold text-foreground">{project.title}</strong>
            <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
              /proiecte/{project.slug}
            </span>
          </span>
        )}
        actions={(
          <Link
            href="/admin/proiecte"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <FaArrowLeft aria-hidden="true" className="h-4 w-4" />
            Înapoi la proiecte
          </Link>
        )}
      />

      <div className="max-w-7xl">
        <ProjectForm action={action} project={project} submitLabel="Salvează modificările" />
      </div>
    </div>
  )
}

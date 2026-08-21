import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

import ProjectForm from '@/components/admin/ProjectForm'
import { syncUserWithDatabase } from '@/lib/auth'
import { createProject } from '../actions'

export default async function AdminProiectNouPage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Proiect nou</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apare pe pagina principală abia după ce îl treci pe „Publicat”
        </p>
      </div>

      <ProjectForm action={createProject} submitLabel="Creează proiectul" />
    </div>
  )
}

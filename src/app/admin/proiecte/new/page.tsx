import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'

import ProjectForm from '@/components/admin/ProjectForm'
import PageIntro from '@/components/ui/PageIntro'
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
    <div className="space-y-6">
      <PageIntro
        eyebrow="Administrare · Proiecte"
        title="Postare nouă"
        description="Pregătește informațiile proiectului și păstrează-l ca ciornă până când conținutul este gata de publicare."
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
        <ProjectForm action={createProject} submitLabel="Salvează postarea" />
      </div>
    </div>
  )
}

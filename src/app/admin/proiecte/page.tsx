import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FaEye, FaEyeSlash, FaPen, FaPlus, FaTrash } from 'react-icons/fa'

import { syncUserWithDatabase } from '@/lib/auth'
import { deleteProject, getAllProjects } from './actions'

export default async function AdminProiectePage() {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  const projects = await getAllProjects()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administrare proiecte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Proiectele afișate pe pagina principală și în /proiecte
          </p>
        </div>
        <Link
          href="/admin/proiecte/new"
          className="mimesiss-btn-primary inline-flex items-center justify-center whitespace-nowrap"
        >
          <FaPlus className="w-4 h-4 mr-2" />
          Adaugă proiect
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mimesiss-card p-8 text-center">
          <p className="text-muted-foreground">
            Niciun proiect încă. Rulează scriptul de migrare sau adaugă unul manual.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="mimesiss-card p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-lg font-semibold text-foreground">{project.title}</h2>

                  {project.status === 'published' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                      <FaEye className="w-3 h-3" />
                      Publicat
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FaEyeSlash className="w-3 h-3" />
                      Ciornă
                    </span>
                  )}

                  {project.kind === 'congress' && (
                    <span className="pill text-xs px-2">Congres</span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{project.summary}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  /proiecte/{project.slug} · ordine {project.order}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/proiecte/edit/${project._id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-border/40 px-4 py-2 text-sm text-foreground transition-colors hover:bg-primary/10"
                >
                  <FaPen className="w-3 h-3" />
                  Editează
                </Link>

                {/* Congresul nu se poate șterge: are ediții și workshopuri legate. */}
                {project.kind !== 'congress' && (
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={project._id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <FaTrash className="w-3 h-3" />
                      Șterge
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

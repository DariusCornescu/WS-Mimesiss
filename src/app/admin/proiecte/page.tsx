import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FaEye, FaEyeSlash, FaPen, FaPlus, FaTrash } from 'react-icons/fa'

import PageIntro from '@/components/ui/PageIntro'
import DuplicateProjectButton from '@/components/admin/DuplicateProjectButton'
import { LocalProjectDraftCleanup } from '@/components/admin/ProjectForm'
import { syncUserWithDatabase } from '@/lib/auth'
import { deleteProject, getAllProjects } from './actions'

export default async function AdminProiectePage({ searchParams }: { searchParams: Promise<{ savedDraft?: string; savedToken?: string }> }) {
  const clerkUser = await currentUser()

  if (!clerkUser) {
    redirect('/auth/login')
  }

  const user = await syncUserWithDatabase(clerkUser)

  if (user.role !== 'admin') {
    redirect('/unauthorized')
  }

  const projects = await getAllProjects()
  const saved = await searchParams

  return (
    <div className="space-y-6">
      <LocalProjectDraftCleanup id={saved.savedDraft} token={saved.savedToken} />
      <PageIntro
        eyebrow="Administrare · Proiecte"
        title="Proiecte și anunțuri"
        description="Configurează proiectele prezentate public, ordinea lor și starea de publicare dintr-un singur loc."
        actions={(
          <Link
            href="/admin/proiecte/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-accent/50 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <FaPlus aria-hidden="true" className="h-4 w-4" />
            Adaugă postare
          </Link>
        )}
      />

      <section className="mimesiss-card p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div><h2 className="font-semibold">Cortul IMM · Povestea animată</h2><p className="text-sm text-muted-foreground mt-1">Adaugă textele de lângă cele trei imagini de album.</p></div>
        <Link href="/admin/proiecte/cortul-imm" className="mimesiss-btn-secondary sm:w-auto">Editează textele</Link>
      </section>

      {([{ slug: 'mimesiss', title: 'MIMESISS' }, { slug: 'balul-bobocilor', title: 'Balul bobocilor' }]).map(story => <section key={story.slug} className="mimesiss-card p-5 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between"><div><h2 className="font-semibold">{story.title} · Povestea animată</h2><p className="text-sm text-muted-foreground mt-1">Editează textele de lângă fotografiile fiecărei scene.</p></div><Link href={'/admin/proiecte/poveste/' + story.slug} className="mimesiss-btn-secondary sm:w-auto">Editează textele</Link></section>)}

      {projects.length === 0 ? (
        <section className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/70 px-6 py-12 text-center" aria-labelledby="empty-projects-title">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
            <FaPlus aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 id="empty-projects-title" className="text-lg font-semibold text-foreground">
            Nu există încă proiecte
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Adaugă primul proiect și păstrează-l ca ciornă până când conținutul este pregătit pentru publicare.
          </p>
          <Link
            href="/admin/proiecte/new"
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <FaPlus aria-hidden="true" className="h-4 w-4" />
            Creează primul proiect
          </Link>
        </section>
      ) : (
        <section aria-labelledby="projects-list-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Conținut public</p>
              <h2 id="projects-list-title" className="mt-1 text-xl font-semibold text-foreground">
                Proiecte configurate
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{projects.length}</span>{' '}
              {projects.length === 1 ? 'proiect' : 'proiecte'}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const isPublished = project.status === 'published'
              const isCongress = project.kind === 'congress'

              return (
                <article
                  key={project._id}
                  className="flex h-full flex-col rounded-xl border border-border/60 bg-card/85 p-5 shadow-lg shadow-background/15 sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      isPublished
                        ? 'border-accent/30 bg-accent/10 text-accent'
                        : 'border-border bg-muted text-muted-foreground'
                    }`}>
                      {isPublished ? (
                        <FaEye aria-hidden="true" className="h-3 w-3" />
                      ) : (
                        <FaEyeSlash aria-hidden="true" className="h-3 w-3" />
                      )}
                      {isPublished ? 'Publicat' : 'Ciornă'}
                    </span>

                    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      isCongress
                        ? 'border-secondary/30 bg-secondary/10 text-secondary'
                        : 'border-primary/25 bg-primary/10 text-foreground'
                    }`}>
                      {isCongress ? 'Congres' : project.kind === 'announcement' ? 'Anunț' : 'Proiect'}
                    </span>

                    <span className="inline-flex min-h-7 items-center rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Ordine {project.order}
                    </span>
                  </div>

                  <div className="mt-5 min-w-0 flex-1">
                    <h3 className="text-xl font-semibold leading-tight text-foreground">{project.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {project.summary}
                    </p>
                  </div>

                  <div className="mt-5 rounded-lg border border-border bg-background/45 px-3 py-2">
                    <p className="break-all font-mono text-xs text-muted-foreground">
                      /proiecte/{project.slug}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2 border-t border-border pt-4 sm:grid-cols-2">
                    <Link
                      href={`/admin/proiecte/edit/${project._id}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-accent/40 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <FaPen aria-hidden="true" className="h-3.5 w-3.5" />
                      Editează
                    </Link>

                    {/* Congresul nu se poate șterge: are ediții și workshopuri legate. */}
                    {isCongress ? (
                      <div className="flex min-h-11 items-center justify-center rounded-lg border border-border bg-background/35 px-4 py-2 text-center text-xs font-medium text-muted-foreground">
                        Proiect protejat
                      </div>
                    ) : (
                      <form action={deleteProject}>
                        <input type="hidden" name="id" value={project._id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                          aria-label={`Șterge proiectul ${project.title}`}
                        >
                          <FaTrash aria-hidden="true" className="h-3.5 w-3.5" />
                          Șterge
                        </button>
                      </form>
                    )}
                  </div>
                  {!isCongress && <div className="mt-2"><DuplicateProjectButton id={project._id} title={project.title} /></div>}
                </article>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

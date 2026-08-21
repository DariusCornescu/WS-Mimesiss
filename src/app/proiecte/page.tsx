import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight } from 'react-icons/fa'

import Reveal from '@/components/asociatie/Reveal'
import { cardSizes, getPublishedProjects } from '@/lib/projects'

export const metadata = {
  title: 'Proiecte',
  description: 'Proiectele Asociației Studenților Mediciniști Militari.',
}

export default async function ProiectePage() {
  const projects = await getPublishedProjects()

  return (
    <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:py-28">
      <Reveal>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Ce facem
        </p>
        <h1 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-tight tracking-tight text-foreground">
          Proiectele asociației
        </h1>
        <div className="mt-6 h-px w-24 bg-gradient-to-r from-primary to-secondary" />
      </Reveal>

      {projects.length === 0 ? (
        <p className="mt-14 text-muted-foreground">
          Niciun proiect publicat momentan.
        </p>
      ) : (
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.slug} delay={i * 110} className={project.span}>
              <Link
                href={project.href}
                className={`group relative block h-full overflow-hidden rounded-lg border border-border/15 transition-all duration-500 hover:-translate-y-1 hover:border-border/50 ${
                  project.kind === 'congress' ? 'min-h-[22rem] lg:min-h-[30rem]' : 'min-h-[15rem]'
                }`}
              >
                <Image
                  src={project.coverImage || '/old/3.jpeg'}
                  alt=""
                  fill
                  sizes={cardSizes(project.span)}
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/10" />
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 via-transparent to-primary/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col justify-end p-6 lg:p-8">
                  {project.kicker && (
                    <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-primary">
                      {project.kicker}
                    </p>
                  )}
                  <h2
                    className={`mt-3 font-bold uppercase leading-none tracking-tight text-foreground ${
                      project.kind === 'congress' ? 'text-4xl lg:text-6xl' : 'text-2xl'
                    }`}
                  >
                    {project.title}
                  </h2>
                  <p
                    className={`mt-3 text-sm leading-relaxed text-muted-foreground ${
                      project.kind === 'congress' ? 'max-w-md' : 'line-clamp-2'
                    }`}
                  >
                    {project.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                    Află mai multe
                    <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa'

import Reveal from '@/components/asociatie/Reveal'
import { getProjectBySlug } from '@/lib/projects'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Proiect negăsit' }
  return { title: project.title, description: project.summary }
}

export default async function ProiectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)

  if (!project) notFound()

  // Congresul are secțiunea lui completă; nu-l dublăm cu o pagină de proiect.
  if (project.kind === 'congress') redirect('/congres')

  return (
    <div className="bg-background">
      <section className="relative flex min-h-[55vh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={project.coverImage || '/old/3.jpeg'}
            alt=""
            fill
            priority
            sizes="100vw"
            className="asmm-kenburns object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-16 pt-28 sm:px-8">
          <Link
            href="/proiecte"
            className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <FaArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1" />
            Proiecte
          </Link>

          {project.kicker && (
            <p
              className="asmm-rise mt-6 font-mono text-xs uppercase tracking-[0.35em] text-primary"
              style={{ animationDelay: '80ms' }}
            >
              {project.kicker}
            </p>
          )}

          <h1
            className="asmm-rise mt-4 text-[clamp(2rem,6vw,4rem)] font-bold uppercase leading-[1] tracking-tight text-foreground"
            style={{ animationDelay: '200ms' }}
          >
            {project.title}
          </h1>

          <div
            className="asmm-draw mt-6 h-px w-24 bg-gradient-to-r from-primary to-secondary"
            style={{ animationDelay: '320ms' }}
          />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:py-24">
        <Reveal>
          <p className="text-lg leading-relaxed text-foreground">{project.summary}</p>

          {project.description && (
            <div className="mt-8 space-y-4">
              {project.description.split('\n').filter(Boolean).map((paragraph, i) => (
                <p key={i} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <Link
            href="/contact"
            className="group mt-12 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
          >
            Ia legătura cu noi
            <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </div>
  )
}

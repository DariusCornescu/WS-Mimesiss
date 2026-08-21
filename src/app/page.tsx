import Image from 'next/image'
import Link from 'next/link'
import { FaArrowRight, FaChevronDown } from 'react-icons/fa'

import Reveal from '@/components/asociatie/Reveal'
import { cardSizes, getPublishedProjects } from '@/lib/projects'

export const metadata = {
  title: 'ASMM — Asociația Studenților Mediciniști Militari',
  description:
    'Asociația care organizează congresul MIMESISS și proiectele studenților mediciniști militari.',
}

/**
 * Homepage-ul asociației. Congresul este unul dintre proiecte, nu rădăcina
 * site-ului — vezi /congres pentru secțiunea lui.
 *
 * Textele proiectelor în afară de MIMESISS sunt încă placeholder, până când
 * asociația confirmă lista. Cifrele din banda de statistici vin din baza de
 * date; „5 ediții" e preluat de pe afișul din banners/ și e de confirmat.
 */

const STATS = [
  { value: '35', label: 'workshopuri și conferințe' },
  { value: '771', label: 'înscrieri la ediția 2025' },
  { value: '272', label: 'participanți înregistrați' },
  // „A V-A EDIȚIE" e luat de pe banners/desktop.jpeg — de confirmat cu asociația.
  { value: '5', label: 'ediții organizate' },
]



export default async function HomePage() {
  const projects = await getPublishedProjects()

  return (
    <div className="bg-background">
      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative flex min-h-[82vh] items-end overflow-hidden">
        <div className="absolute inset-0">
          {/* Fotografie reală, nu afișul evenimentului: banners/desktop.jpeg are
              text încorporat („A V-A EDIȚIE", logo-uri de parteneri) care s-ar
              bate cap în cap cu titlul. */}
          <Image
            src="/old/3.jpeg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="asmm-kenburns object-cover object-center"
          />
          {/* Trei straturi: ancorează textul jos, întunecă stânga pentru
              lizibilitate peste un grup de oameni, stinge marginile. */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_35%,hsl(var(--background))_100%)]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-32 sm:px-8 lg:pb-28">
          <p
            className="asmm-rise font-mono text-xs uppercase tracking-[0.35em] text-primary sm:text-sm"
            style={{ animationDelay: '80ms' }}
          >
            Asociația Studenților Mediciniști Militari
          </p>

          <div
            className="asmm-draw mt-5 h-px w-24 bg-gradient-to-r from-primary to-secondary"
            style={{ animationDelay: '260ms' }}
          />

          {/* leading-[1] și padding pe linia cu gradient: majusculele românești au
              Ă/Î deasupra și Ț cu virgulă dedesubt, iar bg-clip-text taie tot ce
              iese din cutia liniei. Sub 1em se retează diacriticele. */}
          <h1 className="mt-7 max-w-4xl text-[clamp(2.5rem,7.5vw,5.5rem)] font-bold uppercase leading-[1] tracking-tight text-foreground">
            <span className="asmm-rise block" style={{ animationDelay: '200ms' }}>
              Medicină
            </span>
            <span className="asmm-rise block" style={{ animationDelay: '320ms' }}>
              militară,
            </span>
            <span
              className="asmm-rise block bg-gradient-to-r from-primary to-secondary bg-clip-text pb-[0.08em] text-transparent"
              style={{ animationDelay: '440ms' }}
            >
              învățată în practică
            </span>
          </h1>

          <p
            className="asmm-rise mt-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: '560ms' }}
          >
            Suntem asociația care organizează MIMESISS și ține proiectele studenților mediciniști
            militari în mișcare tot anul — nu doar în noiembrie.
          </p>

          <div
            className="asmm-rise mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            style={{ animationDelay: '680ms' }}
          >
            <Link
              href="/congres"
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_35px_-8px_hsl(var(--primary))]"
            >
              Congresul MIMESISS
              <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="#proiecte"
              className="inline-flex items-center justify-center rounded-md border border-border/40 px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-foreground transition-colors duration-300 hover:border-border hover:bg-primary/10"
            >
              Proiectele noastre
            </Link>
          </div>
        </div>

        <FaChevronDown className="asmm-cue absolute bottom-7 left-1/2 z-10 h-4 w-4 -translate-x-1/2 text-muted-foreground" />
      </section>

      {/* --------------------------------------------------------------- CIFRE */}
      <section className="border-y border-border/15">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-6 sm:px-8 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 90}>
              <div className="py-10 lg:py-14">
                <p className="font-mono text-4xl font-bold text-primary sm:text-5xl">{stat.value}</p>
                <p className="mt-2 max-w-[14rem] text-sm leading-snug text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ PROIECTE */}
      <section id="proiecte" className="mx-auto max-w-6xl px-6 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Ce facem
          </p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)] font-bold uppercase leading-tight tracking-tight text-foreground">
            Proiectele asociației
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal
              key={project.slug}
              delay={i * 110}
              className={project.span}
            >
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
                {/* Sheen-ul de brand apare doar la hover, ca proiectul să se „aprindă". */}
                <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 via-transparent to-primary/25 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex h-full flex-col justify-end p-6 lg:p-8">
                  <p className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-primary">
                    {project.kicker}
                  </p>
                  <h3
                    className={`mt-3 font-bold uppercase leading-none tracking-tight text-foreground ${
                      project.kind === 'congress' ? 'text-4xl lg:text-6xl' : 'text-2xl'
                    }`}
                  >
                    {project.title}
                  </h3>
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
      </section>

      {/* --------------------------------------------------------------- DESPRE */}
      <section className="border-t border-border/15 bg-card/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-32">
          <Reveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg sm:aspect-[3/2] lg:aspect-[4/5]">
              <Image
                src="/old/10.jpeg"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            </div>
          </Reveal>

          <Reveal delay={140}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Despre noi
            </p>
            <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold uppercase leading-tight tracking-tight text-foreground">
              Studenți care învață<br />unii de la alții
            </h2>
            <div className="mt-6 h-px w-20 bg-gradient-to-r from-primary to-secondary" />
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              ASMM reunește studenții Institutului Medico-Militar și ai Universității de Medicină și
              Farmacie „Carol Davila”. Organizăm workshopuri practice, conferințe și concursuri
              științifice în spitalele și centrele de simulare unde se face medicina militară.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Congresul MIMESISS este cel mai mare proiect al nostru, dar nu singurul.
            </p>
            <Link
              href="/despre"
              className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary/80"
            >
              Mai multe despre asociație
              <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------ CTA FINAL */}
      <section className="relative overflow-hidden border-t border-border/15">
        <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_50%_100%,hsl(var(--secondary)/0.25),transparent_70%)]" />
        <Reveal className="relative">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-8 lg:py-32">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">
              Ediția următoare
            </p>
            <h2 className="mt-5 text-[clamp(2rem,5vw,3.75rem)] font-bold uppercase leading-[0.95] tracking-tight text-foreground">
              MIMESISS 2026
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">
              Workshopuri, conferințe și concursul de comunicări. Biletele și programul apar aici
              când se deschid înscrierile.
            </p>
            <Link
              href="/congres"
              className="group mt-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_45px_-10px_hsl(var(--primary))]"
            >
              Intră în secțiunea congresului
              <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

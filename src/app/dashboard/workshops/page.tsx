import type { Metadata } from 'next'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FaArrowRight, FaTicketAlt } from 'react-icons/fa'
import { syncUserWithDatabase } from '@/lib/auth'
import { getAppSettings } from '@/lib/settings'
import { getPathChoiceState, pathChoiceOpen } from '@/lib/path-choice'
import { PATH_WORKSHOPS_HREF, pathAudience, pathProject } from '@/lib/path-project'
import PageIntro from '@/components/ui/PageIntro'
import PathWorkshopPicker from '@/components/path/PathWorkshopPicker'

export const metadata: Metadata = { title: 'Alege workshopurile' }

export default async function PathWorkshopChoicePage() {
  const clerkUser = await currentUser()
  if (!clerkUser) redirect('/auth/login')
  const user = await syncUserWithDatabase(clerkUser)

  const [state, settings] = await Promise.all([getPathChoiceState(user.clerkId), getAppSettings()])
  const open = pathChoiceOpen(settings)
  const remaining = Math.max(0, state.limit - state.chosenCount)

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={`PATH · ${pathProject.dateLabel}`}
        title="Alege workshopurile"
        description={<>Biletul tău acoperă un număr de workshopuri; alege-le pe cele la care vrei să participi. Locul se rezervă pe loc, la fiecare alegere. Descrierile complete sunt pe <Link href={PATH_WORKSHOPS_HREF} className="font-semibold text-accent underline-offset-4 hover:underline">pagina workshopurilor</Link>.</>}
      />

      {!state.holdsTicket ? (
        <div className="rounded-xl border border-border/60 bg-card/85 p-6 text-center">
          <FaTicketAlt aria-hidden="true" className="mx-auto h-10 w-10 text-accent/70" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">Ai nevoie de un bilet PATH</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Workshopurile se aleg după cumpărarea biletului. Până atunci, poți vedea mai jos programul și locurile rămase.</p>
          <Link href="/payment" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Cumpără bilet <FaArrowRight aria-hidden="true" className="h-3 w-3" />
          </Link>
        </div>
      ) : !open ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground" role="status">
          Alegerea workshopurilor nu este deschisă acum. {pathAudience.workshopChoiceSoon}
        </p>
      ) : remaining > 0 ? (
        <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 text-sm leading-relaxed text-muted-foreground" role="status">
          Mai poți alege {remaining === 1 ? 'un workshop' : `${remaining} workshopuri`}. {pathAudience.capacityNote}
        </p>
      ) : null}

      <PathWorkshopPicker
        items={state.items}
        chosenCount={state.chosenCount}
        limit={state.limit}
        canChoose={open && state.holdsTicket}
        canCancel={settings.allowCancelRegistration}
      />
    </div>
  )
}

import { Suspense } from 'react'
import WorkshopList from '@/components/WorkshopList'
import RegistrationCountdown from '@/components/RegistrationCountdown'
import WorkshopPageContent from '@/components/asociatie/WorkshopPageContent'
import { getAppSettings } from '@/lib/settings'
import { getActiveEdition } from '@/lib/editions'
export const dynamic = 'force-dynamic'
export default async function Page() {
  const [settings, edition] = await Promise.all([getAppSettings(), getActiveEdition()])
  const countdown = settings.globalRegistrationEnabled && (settings.registrationStartTime || settings.registrationDeadline) ? <RegistrationCountdown startTime={settings.registrationStartTime} deadline={settings.registrationDeadline} /> : null
  return <WorkshopPageContent title={edition ? `Ateliere ${edition.title}` : 'Ateliere MIMESISS'} countdown={countdown}>{!edition || !settings.workshopVisibleToPublic ? <p className="archive-note">Atelierele nu sunt publicate momentan. Revino pentru informații despre următoarea ediție.</p> : <Suspense fallback={<p role="status">Se încarcă atelierele…</p>}><WorkshopList workshopVisibleToPublic={settings.workshopVisibleToPublic} /></Suspense>}</WorkshopPageContent>
}

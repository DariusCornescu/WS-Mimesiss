import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import { getAppSettings } from '@/lib/settings'

export default async function HomePageCTAs() {
  const user = await currentUser()
  const settings = await getAppSettings()
  const paymentsEnabled = settings?.paymentsEnabled ?? false

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      {user ? (
        // Logged in user CTAs
        <>
          {paymentsEnabled && (
            <Link href="/payment" className="mimesiss-btn-primary">
              Cumpără Bilet
            </Link>
          )}
          <Link href="/dashboard" className="mimesiss-btn-primary">
            Accesează Contul
          </Link>
          <Link href="/workshops" className="mimesiss-btn-secondary">
            Vezi Atelierele
          </Link>
        </>
      ) : (
        // Guest user CTAs
        <>
          <Link href="/auth/signup" className="mimesiss-btn-primary">
            Înregistrează-te pentru a cumpara bilet
          </Link>
          <Link href="/info" className="mimesiss-btn-secondary">
            Informații
          </Link>
          <Link href="/reg" className="mimesiss-btn-secondary">
            Regulament
          </Link>
        </>
      )}
    </div>
  )
}

export function HomePageCTAsSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
      <div className="h-12 w-64 bg-muted/50 rounded animate-pulse" />
      <div className="h-12 w-40 bg-muted/50 rounded animate-pulse" />
    </div>
  )
}

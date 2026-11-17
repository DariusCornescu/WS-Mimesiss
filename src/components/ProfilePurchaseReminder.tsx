import Link from 'next/link'

/**
 * Tells a participant which profile details are still missing before they can
 * buy a ticket. Shown on the payment page and in the account while sales are
 * open; the purchase itself is checked again on the server.
 */
export default function ProfilePurchaseReminder({ missing }: { missing: string[] }) {
  if (missing.length === 0) return null
  const items = missing.length > 1
    ? `${missing.slice(0, -1).join(', ')} și ${missing[missing.length - 1]}`
    : missing[0]

  return (
    <div role="status" className="rounded-lg border border-accent/30 bg-accent/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        Profil incomplet
      </p>
      <h2 className="mt-2 text-xl font-semibold text-foreground">Completează-ți profilul ca să poți cumpăra bilet</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">
        Pentru cumpărare mai avem nevoie de {items}. Durează un minut.
      </p>
      <Link href="/dashboard/profile" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-accent/50 bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
        Completează profilul
      </Link>
    </div>
  )
}

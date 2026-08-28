import type { Metadata } from 'next'

/**
 * Secțiunea congresului. Nu adaugă chrome vizual — navigația se schimbă singură
 * în Header după prefixul rutei — dar recuperează metadata congresului, care
 * înainte stătea în root layout, când site-ul era doar despre MIMESISS.
 */
export const metadata: Metadata = {
  title: {
    default: 'MIMESISS — Military Medicine Scientific Session for Students',
    template: '%s | MIMESISS',
  },
  description:
    'Congresul MIMESISS, organizat de ASMM: workshopuri practice, conferințe și concursul de comunicări științifice pentru studenții la medicina militară.',
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'MIMESISS',
    title: 'MIMESISS — Military Medicine Scientific Session for Students',
    description:
      'Workshopuri practice, conferințe și comunicări științifice în medicina militară.',
  },
}

export default function CongresLayout({ children }: { children: React.ReactNode }) {
  return children
}

'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { isPublicPath } from '@/lib/public-routes'

const AccountProvider = dynamic(() => import('./AccountProvider'), {
  loading: () => <p role="status" className="p-6 text-center text-muted-foreground">Se încarcă zona de cont…</p>,
})

export default function AuthBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return isPublicPath(pathname) ? children : <AccountProvider>{children}</AccountProvider>
}

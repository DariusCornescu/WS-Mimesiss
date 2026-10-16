'use client'

import { ClerkProvider } from '@clerk/nextjs'

export default function AccountProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>
}

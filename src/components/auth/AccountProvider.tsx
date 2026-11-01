'use client'

import { ClerkProvider } from '@clerk/nextjs'

/** Clerk theme variables read the same CSS tokens as the rest of the site. */
const appearance = { variables: {
  colorPrimary: 'hsl(var(--primary))',
  colorTextOnPrimaryBackground: 'hsl(var(--primary-foreground))',
  colorBackground: 'hsl(var(--card))',
  colorText: 'hsl(var(--foreground))',
  colorTextSecondary: 'hsl(var(--muted-foreground))',
  colorInputBackground: 'hsl(var(--background))',
  colorInputText: 'hsl(var(--foreground))',
  colorNeutral: 'hsl(var(--foreground))',
  colorDanger: 'hsl(var(--destructive))',
  borderRadius: '0.5rem',
} }

export default function AccountProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>
}

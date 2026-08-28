'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AppSettingsPlain } from '@/lib/settings'

// Serializable settings shape (dates as ISO strings, no Mongoose document).
export type AppSettingsData = AppSettingsPlain

const AppSettingsContext = createContext<AppSettingsData | null>(null)

export function AppSettingsProvider({
  children,
  settings,
}: {
  children: ReactNode
  settings: AppSettingsData
}) {
  return (
    <AppSettingsContext.Provider value={settings}>
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings(): AppSettingsData {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider')
  return ctx
}

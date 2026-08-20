'use client'

import { createContext, useContext, type ReactNode } from 'react'

// Serializable settings shape (dates as ISO strings, no Mongoose Document)
export interface AppSettingsData {
  eventMode: 'workshops' | 'ball'
  globalRegistrationEnabled: boolean
  paymentsEnabled: boolean
  workshopVisibleToPublic: boolean
  allowCancelRegistration: boolean
  registrationStartTime: string | null
  registrationDeadline: string | null
  defaultMaxParticipants: number
  ballTicketAvailableFrom: string | null
  ballTicketAvailableTo: string | null
  ballMaxTicketsPerUser: number
}

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

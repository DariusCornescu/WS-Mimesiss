'use client'

import { useSignIn, useSignUp } from '@clerk/nextjs'
import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import styles from './auth.module.css'

export default function GoogleButton({ mode, disabled = false, onError, onBusyChange }: {
  mode: 'sign-in' | 'sign-up'
  disabled?: boolean
  onError: (message: string) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const { isLoaded: signInLoaded, signIn } = useSignIn()
  const { isLoaded: signUpLoaded, signUp } = useSignUp()
  const isLoaded = mode === 'sign-in' ? signInLoaded : signUpLoaded
  const [busy, setBusy] = useState(false)

  async function connect() {
    if (!isLoaded || busy || (mode === 'sign-in' ? !signIn : !signUp)) return
    setBusy(true)
    onBusyChange?.(true)
    onError('')
    try {
      const options = {
        strategy: 'oauth_google' as const,
        redirectUrl: '/auth/sso-callback',
        redirectUrlComplete: '/auth/complete-profile',
      }
      if (mode === 'sign-in') await signIn!.authenticateWithRedirect(options)
      else await signUp!.authenticateWithRedirect(options)
    } catch {
      onError('Conectarea cu Google nu este disponibilă momentan. Încearcă din nou sau continuă cu email.')
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return <button type="button" className={styles.google} onClick={connect} disabled={disabled || !isLoaded || busy} aria-busy={busy}>
    <FcGoogle aria-hidden="true" />{busy ? 'Se deschide Google…' : 'Continuă cu Google'}
  </button>
}

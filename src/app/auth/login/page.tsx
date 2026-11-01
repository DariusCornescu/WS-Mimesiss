'use client'

import { useState, useEffect } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import AuthShell from '@/components/auth/AuthShell'
import GoogleButton from '@/components/auth/GoogleButton'
import styles from '@/components/auth/auth.module.css'
import { authErrorMessage } from '@/lib/auth-errors'

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { user } = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  useEffect(() => { if (user) router.replace('/auth/complete-profile') }, [user, router])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isLoaded || !signIn || busy || googleBusy) return
    setBusy(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: email.trim(), password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/auth/complete-profile')
      } else {
        router.push('/sign-in')
      }
    } catch (error) {
      setError(authErrorMessage(error, 'Nu am putut finaliza conectarea. Verifică emailul și parola sau încearcă din nou.'))
    } finally { setBusy(false) }
  }

  return <AuthShell>
    {user ? <p role="status" className={styles.status}>Se deschide contul tău…</p> : <>
      <h1 className={styles.heading}>Bine ai revenit</h1>
      <p className={styles.subtitle}>Nu ai încă un cont? <Link href="/auth/signup" className={styles.link}>Creează-ți contul</Link></p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' && <>
        <GoogleButton mode="sign-in" disabled={busy} onError={setError} onBusyChange={setGoogleBusy} />
        <div className={styles.divider}>sau cu email</div>
      </>}
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.field}><label htmlFor="email">Adresa de email</label><div className={styles.inputWrap}><FiMail aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="email" className={styles.input} placeholder="Introdu adresa de email" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
        <div className={styles.field}><label htmlFor="password">Parolă</label><div className={styles.inputWrap}><FiLock aria-hidden="true" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className={`${styles.input} ${styles.password}`} placeholder="Introdu parola" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" className={styles.eye} aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div></div>
        <Link href="/auth/forgot-password" className={styles.link}>Ai uitat parola?</Link>
        <button className={styles.primary} disabled={!isLoaded || busy || googleBusy} aria-busy={busy}>{busy ? 'Se conectează…' : 'Conectează-te'}</button>
      </form>
    </>}
  </AuthShell>
}

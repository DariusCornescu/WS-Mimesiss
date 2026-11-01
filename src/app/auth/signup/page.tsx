'use client'

import { useEffect, useState } from 'react'
import { useSignUp, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import AuthShell from '@/components/auth/AuthShell'
import GoogleButton from '@/components/auth/GoogleButton'
import styles from '@/components/auth/auth.module.css'
import { authErrorMessage } from '@/lib/auth-errors'

export default function SignupPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { user } = useUser()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [notice, setNotice] = useState('')
  const [resendAfter, setResendAfter] = useState(0)

  useEffect(() => {
    if (user) router.replace('/auth/complete-profile')
  }, [user, router])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!isLoaded || !signUp || busy || googleBusy) return
    if (!firstName.trim() || !lastName.trim()) {
      setError('Completează prenumele și numele.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await signUp.create({ firstName: firstName.trim(), lastName: lastName.trim(), emailAddress: email.trim(), password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/auth/complete-profile')
        return
      }
      setVerifying(true)
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setResendAfter(Date.now() + 30_000)
    } catch (error) {
      setError(authErrorMessage(error, 'Nu am putut crea contul. Încearcă din nou.'))
    } finally { setBusy(false) }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault()
    if (!isLoaded || !signUp || busy) return
    setBusy(true)
    setError('')
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/auth/complete-profile')
      } else {
        router.push('/sign-up')
      }
    } catch (error) {
      setError(authErrorMessage(error, 'Nu am putut verifica adresa de email. Încearcă din nou.'))
    } finally { setBusy(false) }
  }

  async function resend() {
    if (!isLoaded || !signUp || busy) return
    if (Date.now() < resendAfter) {
      setNotice('Așteaptă 30 de secunde înainte de a solicita un cod nou.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setResendAfter(Date.now() + 30_000)
      setNotice('Am trimis un cod nou. Verifică și folderul Spam.')
    } catch (error) {
      setError(authErrorMessage(error, 'Nu am putut retrimite codul. Încearcă din nou.'))
    } finally { setBusy(false) }
  }

  return <AuthShell>
    {user ? <p role="status" className={styles.status}>Se deschide contul tău…</p> : verifying ? <>
      <h1 className={styles.heading}>Verifică adresa de email</h1>
      <p className={styles.subtitle}>Am trimis un cod la <strong>{email}</strong>. După verificare, îți vei confirma profilul.</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <form className={styles.form} onSubmit={verify}>
        <div className={styles.field}><label htmlFor="code">Cod de verificare</label><input id="code" name="code" className={styles.input} value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus /></div>
        <button className={styles.primary} disabled={busy || !isLoaded} aria-busy={busy}>{busy ? 'Se verifică…' : 'Verifică și continuă'}</button>
      </form>
      <div className={styles.actions}><button type="button" className={styles.link} disabled={busy} onClick={resend}>Retrimite codul</button><button type="button" className={styles.link} disabled={busy} onClick={() => { setVerifying(false); setError(''); setCode(''); setNotice('') }}>Schimbă adresa de email</button></div>
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
    </> : <>
      <h1 className={styles.heading}>Creează-ți contul</h1>
      <p className={styles.subtitle}>Ai deja cont? <Link href="/auth/login" className={styles.link}>Conectează-te</Link></p>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true' && <>
        <GoogleButton mode="sign-up" disabled={busy} onError={setError} onBusyChange={setGoogleBusy} />
        <p className={`${styles.hint} ${styles.googleHint}`}>Îți vei confirma profilul la pasul următor.</p>
        <div className={styles.divider}>sau cu email</div>
      </>}
      <form className={styles.form} onSubmit={submit}>
        <div className={styles.names}>
          <div className={styles.field}><label htmlFor="firstName">Prenume</label><div className={styles.inputWrap}><FiUser aria-hidden="true" /><input id="firstName" name="firstName" autoComplete="given-name" className={styles.input} placeholder="Prenume" value={firstName} onChange={e => setFirstName(e.target.value)} required maxLength={100} /></div></div>
          <div className={styles.field}><label htmlFor="lastName">Nume</label><div className={styles.inputWrap}><FiUser aria-hidden="true" /><input id="lastName" name="lastName" autoComplete="family-name" className={styles.input} placeholder="Nume" value={lastName} onChange={e => setLastName(e.target.value)} required maxLength={100} /></div></div>
        </div>
        <div className={styles.field}><label htmlFor="email">Adresa de email</label><div className={styles.inputWrap}><FiMail aria-hidden="true" /><input id="email" name="email" type="email" autoComplete="email" className={styles.input} placeholder="Introdu adresa de email" value={email} onChange={e => setEmail(e.target.value)} required /></div></div>
        <div className={styles.field}><label htmlFor="password">Parolă</label><div className={styles.inputWrap}><FiLock aria-hidden="true" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className={`${styles.input} ${styles.password}`} placeholder="Introdu parola" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} aria-describedby="password-hint" /><button type="button" className={styles.eye} aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FiEyeOff /> : <FiEye />}</button></div><p id="password-hint" className={styles.hint}>Cel puțin 8 caractere.</p></div>
        <div id="clerk-captcha" />
        <button type="submit" className={styles.primary} disabled={!isLoaded || busy || googleBusy} aria-busy={busy}>{busy ? 'Se creează contul…' : 'Creează contul'}</button>
      </form>
    </>}
  </AuthShell>
}

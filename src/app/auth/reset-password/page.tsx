'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthShell from '@/components/auth/AuthShell'
import styles from '@/components/auth/auth.module.css'

function ResetPasswordForm() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  
  const { signIn, isLoaded, setActive } = useSignIn()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Get email from URL params
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Don't render the form if user is already logged in
  if (user) {
    return (
      <AuthShell>
        <p role="status" className={styles.status}>Ești deja conectat. Se deschide contul tău…</p>
      </AuthShell>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) return

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Parolele nu se potrivesc')
      return
    }

    if (password.length < 8) {
      setError('Parola trebuie să aibă cel puțin 8 caractere')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Attempt to reset the password using the code
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      })

      if (result.status === 'complete') {
        // Password reset successful
        // Set the active session to ensure proper authentication state
        if (result.createdSessionId && setActive) {
          await setActive({ session: result.createdSessionId })
        }
        
        router.replace('/dashboard')
        router.refresh()
      } else {
        setError('Procesul de resetare nu s-a finalizat. Încearcă din nou.')
      }
    } catch (err: unknown) {
      console.error('Password reset error:', err)
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]) {
        const errorMsg = err.errors[0].message
        const errorCode = err.errors[0].code
        
        switch (errorCode) {
          case 'form_code_incorrect':
          case 'verification_failed':
            setError('Codul de verificare este incorect sau a expirat')
            break
          case 'form_password_validation_failed':
            setError('Parola nu îndeplinește cerințele de securitate (minim 8 caractere)')
            break
          case 'form_password_too_common':
            setError('Parola este prea comună. Alege o parolă mai sigură.')
            break
          case 'session_exists':
            router.replace('/dashboard')
            router.refresh()
            return
          default:
            setError(errorMsg || 'A apărut o eroare. Încearcă din nou.')
        }
      } else {
        setError('A apărut o eroare. Încearcă din nou.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    if (!email || !isLoaded) return

    try {
      setNotice('')
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setError('')
      setNotice('Codul a fost retrimis. Verifică și folderul Spam.')
    } catch (err: unknown) {
      console.error('Resend code error:', err)
      setNotice('')
      setError('Nu s-a putut retrimite codul')
    }
  }

  return (
    <AuthShell>
      <h1 className={styles.heading}>Resetare parolă</h1>
      <p className={styles.subtitle}>
        Introdu codul primit pe email și alege noua parolă.
        {email && <> Codul a fost trimis la <strong>{email}</strong>.</>}
      </p>

      {error && <p role="alert" className={styles.error}>{error}</p>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="code">Cod de verificare</label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={styles.input}
            placeholder="Introdu codul din email"
          />
          {email && <button type="button" onClick={resendCode} className={styles.link} disabled={!isLoaded}>Retrimite codul</button>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Parola nouă</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="Minim 8 caractere"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="confirmPassword">Confirmă parola</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            placeholder="Reintrodu parola"
          />
        </div>

        <button
          type="submit"
          disabled={!isLoaded || isLoading || !code || !password || !confirmPassword}
          className={styles.primary}
          aria-busy={isLoading}
        >
          {isLoading ? 'Se resetează…' : 'Resetează parola'}
        </button>
      </form>

      <div className={styles.actions}>
        <Link href="/auth/forgot-password" className={styles.link}>← Cere un cod nou</Link>
        <Link href="/auth/login" className={styles.link}>Înapoi la autentificare</Link>
      </div>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell><p role="status" className={styles.status}>Se încarcă…</p></AuthShell>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

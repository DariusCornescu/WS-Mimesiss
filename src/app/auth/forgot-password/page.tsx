'use client'

import { useState, useEffect } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiMail } from 'react-icons/fi'
import AuthShell from '@/components/auth/AuthShell'
import styles from '@/components/auth/auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')
  const { signIn, isLoaded } = useSignIn()
  const { user } = useUser()
  const router = useRouter()

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

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
    
    if (!isLoaded || !email) return

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      // Create a password reset using Clerk
      const result = await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })

      if (result.status === 'needs_first_factor') {
        setSuccessMessage('Am trimis mesajul de resetare. Verifică și folderul Spam.')
        
        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        setError('Nu am putut începe resetarea. Încearcă din nou.')
      }
    } catch (err: unknown) {
      console.error('Password reset error:', err)
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]) {
        const errorCode = err.errors[0].code
        const errorMessage = err.errors[0].message
        
        switch (errorCode) {
          case 'form_identifier_not_found':
            setError('Adresa de email nu a fost găsită în sistem.')
            break
          case 'form_identifier_invalid':
            setError('Adresa de email nu este validă.')
            break
          case 'too_many_requests':
            setError('Prea multe încercări. Așteaptă câteva minute și încearcă din nou.')
            break
          default:
            setError(errorMessage || 'A apărut o eroare. Încearcă din nou.')
        }
      } else {
        setError('A apărut o eroare. Încearcă din nou.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className={styles.heading}>Resetare parolă</h1>
      <p className={styles.subtitle}>Introdu adresa de email pentru a primi instrucțiunile de resetare.</p>

      {successMessage && <p role="status" className={styles.notice}>{successMessage}</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">Adresa de email</label>
          <div className={styles.inputWrap}>
            <FiMail aria-hidden="true" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="nume@exemplu.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!isLoaded || isLoading || !email}
          className={styles.primary}
          aria-busy={isLoading}
        >
          {isLoading ? 'Se trimite…' : 'Trimite emailul de resetare'}
        </button>
      </form>

      <div className={styles.actions}>
        <Link href="/auth/login" className={styles.link}>← Înapoi la autentificare</Link>
      </div>
    </AuthShell>
  )
}

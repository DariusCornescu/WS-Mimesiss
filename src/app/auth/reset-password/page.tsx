'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
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
      <div className="min-h-screen flex items-center justify-center bg-muted px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <p className="text-foreground">Sunteți deja conectat. Redirecționare...</p>
        </div>
      </div>
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
        
        // Force a page reload to ensure authentication state is properly synced
        window.location.href = '/dashboard'
      } else {
        setError('Procesul de resetare nu s-a finalizat. Încercați din nou.')
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
            setError('Parola este prea comună. Alegeți o parolă mai sigură.')
            break
          case 'session_exists':
            // If session already exists, just redirect
            window.location.href = '/dashboard'
            return
          default:
            setError(errorMsg || 'A apărut o eroare. Încercați din nou.')
        }
      } else {
        setError('A apărut o eroare. Încercați din nou.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resendCode = async () => {
    if (!email || !isLoaded) return

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setError('')
      alert('Codul a fost retrimis!')
    } catch (err: unknown) {
      console.error('Resend code error:', err)
      setError('Nu s-a putut retrimite codul')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Resetare Parolă
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Introduceți codul primit pe email și noua parolă
          </p>
          {email && (
            <p className="mt-1 text-xs text-muted-foreground">
              Email: {email}
            </p>
          )}
        </div>

        <div className="bg-card rounded-lg shadow-md p-8">
          {error && (
            <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground">
                Cod de Verificare *
              </label>
              <div className="mt-1">
                <input
                  name="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Introduceți codul din email"
                />
              </div>
              {email && (
                <button
                  type="button"
                  onClick={resendCode}
                  className="mt-1 text-xs text-primary hover:text-primary/80"
                >
                  Retrimite codul
                </button>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Parola Nouă *
              </label>
              <div className="mt-1">
                <input
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Minim 8 caractere"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirmă Parola *
              </label>
              <div className="mt-1">
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Reintroduceți parola"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !code || !password || !confirmPassword}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || !code || !password || !confirmPassword
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                }`}
              >
                {isLoading && (
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                )}
                {isLoading ? 'Se resetează...' : 'Resetează Parola'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center space-y-2">
            <Link
              href="/auth/forgot-password"
              className="block text-sm text-primary hover:text-primary/80"
            >
              ← Înapoi la cererea de resetare
            </Link>
            <Link
              href="/auth/login"
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              Înapoi la autentificare
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

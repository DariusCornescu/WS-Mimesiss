'use client'

import { useState, useEffect } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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
      <div className="min-h-screen flex items-center justify-center bg-muted px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <p className="text-foreground">Sunteți deja conectat. Redirecționare...</p>
        </div>
      </div>
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
        setSuccessMessage('Emailul de resetare a parolei a fost trimis! Verificați-vă căsuța de email.')
        
        // Redirect to reset password page after 2 seconds
        setTimeout(() => {
          router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
        }, 2000)
      } else {
        setError('Nu s-a putut inițializa procesul de resetare. Încercați din nou.')
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
            setError('Prea multe încercări. Vă rugăm să așteptați câteva minute.')
            break
          default:
            setError(errorMessage || 'A apărut o eroare. Încercați din nou.')
        }
      } else {
        setError('A apărut o eroare. Încercați din nou.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Image src="/icons/logo.png" alt="MIMESISS 2025" width={100} height={100} className="mx-auto w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Resetare Parolă
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Introduceți adresa de email pentru a primi instrucțiuni de resetare
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-md p-8">
          {successMessage && (
            <div className="mb-4 p-4 rounded-md bg-green-50 border border-green-200">
              <p className="text-green-800 text-sm">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 rounded-md bg-red-50 border border-red-200">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Adresa de Email *
              </label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="nume@exemplu.com"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLoading || !email
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
                }`}
              >
                {isLoading && (
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                )}
                {isLoading ? 'Se trimite...' : 'Trimite Email de Resetare'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:text-primary/80"
            >
              ← Înapoi la autentificare
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

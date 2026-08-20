'use client'

import { useState, useEffect } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa'
import Image from 'next/image'

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const { user } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <p className="text-foreground">Redirecționare la dashboard...</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLoaded) {
      setError('Clerk nu este încă încărcat. Vă rugăm să așteptați...')
      return
    }

    if (!signIn) {
      setError('Serviciul de autentificare nu este disponibil. Vă rugăm să reîncărcați pagina.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.push('/dashboard')
      } else {
        setError('Nu s-a putut finaliza autentificarea. Vă rugăm să încercați din nou.')
      }
    } catch (err: unknown) {
      console.error('Login error:', err) // Add logging for debugging
      
      if (err && typeof err === 'object' && 'errors' in err) {
        const errorObj = err as { errors?: Array<{ code: string; message?: string }> }
        if (errorObj.errors?.[0]) {
          const errorCode = errorObj.errors[0].code
          const errorMessage = errorObj.errors[0].message
          
          console.log('Error code:', errorCode, 'Message:', errorMessage) // Debug logging
          
          switch (errorCode) {
            case 'form_identifier_not_found':
              setError('Adresa de email nu a fost găsită.')
              break
            case 'form_password_incorrect':
              setError('Parola este incorectă.')
              break
            case 'form_identifier_exists':
              setError('Această adresă de email există deja.')
              break
            case 'session_exists':
              setError('Sunteți deja conectat.')
              break
            case 'too_many_requests':
              setError('Prea multe încercări. Vă rugăm să așteptați câteva minute.')
              break
            case 'form_password_validation_failed':
              setError('Parola nu îndeplinește cerințele de securitate.')
              break
            case 'form_identifier_invalid':
              setError('Adresa de email nu este validă.')
              break
            default:
              setError(`A apărut o eroare la autentificare: ${errorMessage || errorCode}. Vă rugăm să încercați din nou.`)
          }
        } else {
          setError('A apărut o eroare la autentificare. Vă rugăm să încercați din nou.')
        }
      } else {
        const errorString = err instanceof Error ? err.message : String(err)
        setError(`A apărut o eroare la autentificare: ${errorString}. Vă rugăm să încercați din nou.`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Image src="/icons/asmm.png" alt="MIMESISS 2025" width={200} height={200} className="mx-auto w-auto" />

          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Conecteaza-te
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Nu aveți cont?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80">
              Înregistrați-vă aici
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Adresa de email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Introduceți adresa de email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Parola
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Introduceți parola"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  ) : (
                    <FaEye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/80">
                Ați uitat parola?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Se conectează...
                </div>
              ) : (
                'Conectare'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

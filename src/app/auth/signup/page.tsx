'use client'

import { useState, useEffect } from 'react'
import { useSignUp, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaUser, FaLock, FaEye, FaEyeSlash, FaEnvelope } from 'react-icons/fa'
import Image from 'next/image'
import { UserType } from '@/types/models'

export default function SignupPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const { user } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')
  const [userType, setUserType] = useState<UserType>('student')
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
          <p className="text-foreground">Sunteți deja conectat. Redirecționare...</p>
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

    if (!signUp) {
      setError('Serviciul de înregistrare nu este disponibil. Vă rugăm să reîncărcați pagina.')
      return
    }

    setIsLoading(true)
    setError('')

    // Validate required fields
    if (!firstName.trim()) {
      setError('Prenumele este obligatoriu.')
      setIsLoading(false)
      return
    }

    if (!lastName.trim()) {
      setError('Numele este obligatoriu.')
      setIsLoading(false)
      return
    }

    try {
      // Create the user with email, password, firstName, and lastName
      await signUp.create({
        emailAddress: email,
        password,
        firstName,
        lastName,
        unsafeMetadata: { userType }
      })

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setVerifying(true)
    } catch (err: unknown) {

      if (err && typeof err === 'object' && 'errors' in err) {
        const errorObj = err as { errors?: Array<{ code: string; message?: string }> }
        if (errorObj.errors?.[0]) {
          const errorCode = errorObj.errors[0].code
          const errorMessage = errorObj.errors[0].message

          switch (errorCode) {
            case 'form_identifier_exists':
              setError('Această adresă de email este deja înregistrată.')
              break
            case 'form_password_pwned':
              setError('Această parolă a fost compromisă. Vă rugăm să alegeți o parolă mai sigură.')
              break
            case 'form_password_too_common':
              setError('Această parolă este prea comună. Vă rugăm să alegeți o parolă mai sigură.')
              break
            case 'form_password_length_too_short':
              setError('Parola trebuie să aibă cel puțin 8 caractere.')
              break
            case 'form_password_validation_failed':
              setError('Parola nu îndeplinește cerințele de securitate.')
              break
            case 'form_identifier_invalid':
              setError('Adresa de email nu este validă.')
              break
            case 'form_param_nil':
              setError('Toate câmpurile sunt obligatorii.')
              break
            default:
              setError(`A apărut o eroare la înregistrare: ${errorMessage || errorCode}. Vă rugăm să încercați din nou.`)
          }
        } else {
          setError('A apărut o eroare la înregistrare. Vă rugăm să încercați din nou.')
        }
      } else {
        const errorString = err instanceof Error ? err.message : String(err)
        setError(`A apărut o eroare la înregistrare: ${errorString}. Vă rugăm să încercați din nou.`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isLoaded) return

    setIsLoading(true)
    setError('')

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.push('/dashboard')
      } else {
        setError('Nu s-a putut finaliza verificarea. Vă rugăm să încercați din nou.')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        const errorObj = err as { errors?: Array<{ code: string }> }
        if (errorObj.errors?.[0]) {
          const errorCode = errorObj.errors[0].code
          switch (errorCode) {
            case 'form_code_incorrect':
              setError('Codul de verificare este incorect.')
              break
            case 'verification_expired':
              setError('Codul de verificare a expirat. Vă rugăm să solicitați unul nou.')
              break
            default:
              setError('A apărut o eroare la verificare. Vă rugăm să încercați din nou.')
          }
        } else {
          setError('A apărut o eroare la verificare. Vă rugăm să încercați din nou.')
        }
      } else {
        setError('A apărut o eroare la verificare. Vă rugăm să încercați din nou.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Image src="/icons/asmm.png" alt="MIMESISS 2025" width={100} height={100} className="mx-auto w-auto" />
            <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
              Verificați adresa de email
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Am trimis un cod de verificare la adresa {email}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleVerification}>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                Cod de verificare
              </label>
              <input
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Introduceți codul de verificare"
              />
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
                    Se verifică...
                  </div>
                ) : (
                  'Verifică'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Image src="/icons/asmm.png" alt="MIMESISS 2025" width={100} height={100} className="mx-auto w-auto" />
          <h2 className="mt-6 text-center text-3xl font-bold text-foreground">
            Creați un cont nou
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Aveți deja cont?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Conectați-vă aici
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                  Prenume
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Prenume"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                  Nume
                </label>
                <input
                  name="lastName"
                  type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Nume"
                />
              </div>
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-foreground mb-2">
                Tip utilizator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-muted-foreground" />
                </div>
                <select
                  name="userType"
                  required
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as UserType)}
                  className="block w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Selectati tipul de utilizator</option>
                  <option value="student">Student</option>
                  <option value="elev">Elev</option>
                  <option value="rezident">Rezident</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Adresa de email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-4 w-4 text-muted-foreground" />
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-input bg-background rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Introduceți parola (min. 8 caractere)"
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

          {/* CAPTCHA widget */}
          <div>
            <div id="clerk-captcha"></div>
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
                  Se înregistrează...
                </div>
              ) : (
                'Înregistrare'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

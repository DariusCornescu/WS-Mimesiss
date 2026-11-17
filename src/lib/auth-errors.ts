import { PASSWORD_MIN_LENGTH } from '@/lib/password-policy'

type ProviderError ={ code?: string; message?: string; longMessage?: string }

export function authErrorMessage(error: unknown, fallback: string): string {
  const first: ProviderError | undefined = error && typeof error === 'object' && 'errors' in error
    ? (error as { errors?: ProviderError[] }).errors?.[0]
    : undefined
  const code = first?.code
  const messages: Record<string, string> = {
    form_identifier_exists: 'Această adresă de email este deja înregistrată. Conectează-te la contul existent.',
    form_identifier_invalid: 'Introdu o adresă de email validă.',
    form_password_pwned: 'Această parolă apare într-o breșă de securitate. Alege o altă parolă.',
    form_password_too_common: 'Această parolă este prea comună. Alege o parolă mai sigură.',
    form_password_validation_failed: 'Parola nu îndeplinește cerințele de securitate.',
    form_code_incorrect: 'Codul de verificare este incorect. Încearcă din nou.',
    verification_expired: 'Codul de verificare a expirat. Solicită un cod nou.',
    too_many_requests: 'Prea multe încercări. Așteaptă câteva minute și încearcă din nou.',
  }
  if (code === 'form_password_length_too_short') {
    // The minimum is set in the sign-in provider, not here: quote its number.
    const minimum = /\d+/.exec(first?.longMessage ?? first?.message ?? '')?.[0] ?? String(PASSWORD_MIN_LENGTH)
    return `Parola trebuie să aibă cel puțin ${minimum} caractere.`
  }
  if (code && messages[code]) return messages[code]
  // An unmapped failure is usually a configuration mismatch; keep its code findable.
  if (code) console.error('Unhandled authentication error:', code)
  return fallback
}

export function authErrorMessage(error: unknown, fallback: string): string {
  const code = error && typeof error === 'object' && 'errors' in error
    ? (error as { errors?: { code?: string }[] }).errors?.[0]?.code
    : undefined
  const messages: Record<string, string> = {
    form_identifier_exists: 'Această adresă de email este deja înregistrată. Conectează-te la contul existent.',
    form_identifier_invalid: 'Introdu o adresă de email validă.',
    form_password_pwned: 'Această parolă apare într-o breșă de securitate. Alege o altă parolă.',
    form_password_too_common: 'Această parolă este prea comună. Alege o parolă mai sigură.',
    form_password_length_too_short: 'Parola trebuie să aibă cel puțin 8 caractere.',
    form_password_validation_failed: 'Parola nu îndeplinește cerințele de securitate.',
    form_code_incorrect: 'Codul de verificare este incorect. Încearcă din nou.',
    verification_expired: 'Codul de verificare a expirat. Solicită un cod nou.',
    too_many_requests: 'Prea multe încercări. Așteaptă câteva minute și încearcă din nou.',
  }
  return (code && messages[code]) || fallback
}

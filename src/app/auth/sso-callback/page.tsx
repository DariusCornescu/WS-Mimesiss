'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import AuthShell from '@/components/auth/AuthShell'
import styles from '@/components/auth/auth.module.css'

export default function SsoCallbackPage() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 12000)
    return () => window.clearTimeout(timer)
  }, [])

  return <AuthShell>
    <h1 className={styles.heading}>Se finalizează conectarea</h1>
    <p role="status" className={styles.subtitle}>Te redirecționăm către contul tău.</p>
    <AuthenticateWithRedirectCallback signInUrl="/sign-in" signUpUrl="/sign-up" signInForceRedirectUrl="/auth/complete-profile" signUpForceRedirectUrl="/auth/complete-profile" />
    <div id="clerk-captcha" data-cl-theme="dark" />
    {slow && <p role="alert" className={styles.notice}>Conectarea durează prea mult. Dacă ai deschis pagina în browserul altei aplicații, copiază adresa site-ului și deschide-o în Chrome, Edge sau Safari.</p>}
    <p className={styles.notice}>Dacă procesul nu continuă, <Link href="/auth/login" className={styles.link}>revino la conectare</Link>.</p>
  </AuthShell>
}

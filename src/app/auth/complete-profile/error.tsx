'use client'

import Link from 'next/link'
import AuthShell from '@/components/auth/AuthShell'
import styles from '@/components/auth/auth.module.css'

export default function ProfileError({ reset }: { reset: () => void }) {
  return <AuthShell>
    <h1 className={styles.heading}>Profilul nu poate fi încărcat</h1>
    <p role="alert" className={styles.error}>A apărut o problemă la încărcarea datelor. Încearcă din nou peste câteva momente.</p>
    <button type="button" className={styles.primary} onClick={reset}>Încearcă din nou</button>
    <p className={styles.notice}><Link href="/" className={styles.link}>Înapoi la ASMM</Link></p>
  </AuthShell>
}

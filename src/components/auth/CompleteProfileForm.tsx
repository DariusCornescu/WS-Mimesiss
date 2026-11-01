'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import AuthShell from './AuthShell'
import styles from './auth.module.css'
import type { UserType } from '@/types/models'

export default function CompleteProfileForm(props: { firstName: string; lastName: string; userType: UserType | '' }) {
  const [firstName, setFirstName] = useState(props.firstName)
  const [lastName, setLastName] = useState(props.lastName)
  const [userType, setUserType] = useState(props.userType)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user } = useUser()

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/auth/complete-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, userType }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Nu am putut salva profilul.')
      await user?.reload()
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Nu am putut salva profilul. Încearcă din nou.')
      setBusy(false)
    }
  }

  return <AuthShell>
    <h1 className={styles.heading}>Completează-ți profilul</h1>
    <p className={styles.subtitle}>Confirmă numele și categoria de participare pentru înscrieri și bilete.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.names}>
        <div className={styles.field}><label htmlFor="firstName">Prenume</label><input className={styles.input} id="firstName" name="firstName" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} required maxLength={100} /></div>
        <div className={styles.field}><label htmlFor="lastName">Nume</label><input className={styles.input} id="lastName" name="lastName" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} required maxLength={100} /></div>
      </div>
      <div className={styles.field}><label htmlFor="userType">Profilul tău</label><select id="userType" name="userType" className={styles.input} value={userType} onChange={e => setUserType(e.target.value as UserType | '')} required><option value="" disabled>Alege categoria</option><option value="student">Student</option><option value="elev">Elev</option><option value="rezident">Rezident</option></select></div>
      <button className={styles.primary} disabled={busy} aria-busy={busy}>{busy ? 'Se salvează…' : 'Salvează și continuă'}</button>
    </form>
  </AuthShell>
}

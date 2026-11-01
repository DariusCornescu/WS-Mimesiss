'use client'

import { useActionState } from 'react'
import { FaCopy } from 'react-icons/fa'
import { duplicateProject } from '@/app/admin/proiecte/actions'

export default function DuplicateProjectButton({ id, title }: { id: string; title: string }) {
  const [state, action, pending] = useActionState(duplicateProject.bind(null, id), {})
  return <form action={action}>
    <button type="submit" disabled={pending} aria-label={`Duplică postarea ${title}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background/50 px-4 py-2 text-sm font-semibold transition-colors hover:border-accent/40 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"><FaCopy aria-hidden="true" className="h-3.5 w-3.5" />{pending ? 'Se creează copia…' : 'Duplică în ciornă'}</button>
    {state.error && <p role="alert" className="mt-2 text-sm text-destructive">{state.error}</p>}
  </form>
}

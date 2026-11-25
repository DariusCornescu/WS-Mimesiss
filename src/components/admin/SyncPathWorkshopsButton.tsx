'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaCloudUploadAlt } from 'react-icons/fa'
import { syncPathWorkshopsAction } from '@/app/admin/workshops/actions'

/** Publishes the PATH programme as workshops participants can choose. */
export default function SyncPathWorkshopsButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const result = await syncPathWorkshopsAction()
      if (result.success) {
        setMessage({ type: 'success', text: result.message ?? 'Sincronizare reușită.' })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error ?? 'Nu am putut sincroniza workshopurile PATH.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Nu am putut sincroniza workshopurile PATH.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaCloudUploadAlt aria-hidden="true" className="mr-2 h-4 w-4" />
        {loading ? 'Se sincronizează…' : 'Sincronizează workshopurile PATH'}
      </button>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`rounded-md border px-3 py-2 text-sm ${message.type === 'success' ? 'border-accent/40 bg-accent/10 text-foreground' : 'border-destructive/40 bg-destructive/10 text-destructive'}`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}

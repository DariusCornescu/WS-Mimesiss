'use client'

import { useId, useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { generateWorkshopsReport } from '@/app/admin/workshops/actions'

export function DownloadReportButton() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const errorId = useId()

  async function handleDownload() {
    setIsGenerating(true)
    setError('')

    try {
      const csvContent = await generateWorkshopsReport()

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `workshops-report-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
    } catch (caughtError) {
      console.error('Error generating report:', caughtError)
      setError('Raportul nu a putut fi generat. Încearcă din nou.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        aria-busy={isGenerating}
        aria-describedby={error ? errorId : undefined}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FaDownload aria-hidden="true" className="mr-2 h-4 w-4" />
        {isGenerating ? 'Se generează…' : 'Descarcă raportul'}
      </button>
      {error && (
        <p id={errorId} role="alert" className="max-w-xs text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

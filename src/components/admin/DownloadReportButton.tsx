'use client'

import { useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { generateWorkshopsReport } from '@/app/admin/workshops/actions'

export function DownloadReportButton() {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleDownload() {
    setIsGenerating(true)
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
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Eroare la generarea raportului. Vă rugăm încercați din nou.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <FaDownload className="mr-2 h-4 w-4" />
      {isGenerating ? 'Generare...' : 'Descarcă raport'}
    </button>
  )
}

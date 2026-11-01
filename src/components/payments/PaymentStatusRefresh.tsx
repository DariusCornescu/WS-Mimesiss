'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PaymentStatusRefresh() {
  const router = useRouter()
  const [automatic, setAutomatic] = useState(true)

  useEffect(() => {
    let attempts = 0
    const timer = window.setInterval(() => {
      router.refresh()
      attempts += 1
      if (attempts >= 15) {
        window.clearInterval(timer)
        setAutomatic(false)
      }
    }, 4000)
    return () => window.clearInterval(timer)
  }, [router])

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="flex min-h-12 w-full items-center justify-center rounded-lg border border-accent/35 bg-accent/10 px-4 py-3 font-semibold text-accent transition-colors hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {automatic ? 'Verifică acum' : 'Verifică din nou'}
    </button>
  )
}

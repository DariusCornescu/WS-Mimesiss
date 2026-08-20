'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft, FaSearch, FaTicketAlt, FaUser } from 'react-icons/fa'
import Link from 'next/link'

interface TicketLookup {
  ticketId: string
  ticketNumber: number
  ticketTitle: string
  status: 'active' | 'used' | 'cancelled'
  category: string
  owner: { name: string; email: string | null }
}

/**
 * BarcodeDetector is not in lib.dom yet, and is unsupported in Safari and
 * Firefox — which is most phones at an event, hence the fallback handling.
 */
interface DetectedBarcode {
  rawValue: string
}

type BarcodeDetectorCtor = new (options: { formats: string[] }) => {
  detect(source: ImageData): Promise<DetectedBarcode[]>
}

function getBarcodeDetector(): BarcodeDetectorCtor | null {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null
  return (window as unknown as { BarcodeDetector: BarcodeDetectorCtor }).BarcodeDetector
}

export default function QRScanner() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const hasScanned = useRef(false)
  const detectErrorReported = useRef(false)
  const [error, setError] = useState<string | null>(null)

  // Manual input state
  const [manualOpen, setManualOpen] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [found, setFound] = useState<TicketLookup | null>(null)

  useEffect(() => {
    let animationId: number
    const Detector = getBarcodeDetector()

    async function startCamera() {
      // Bail before requesting the camera: without BarcodeDetector the
      // viewfinder would open and simply never detect anything, so asking for
      // permission first would be misleading.
      if (!Detector) {
        setError(
          'Browserul acesta nu suportă scanarea automată (Safari și Firefox). ' +
          'Folosiți Chrome, sau căutați biletul după număr mai jos.'
        )
        setManualOpen(true)
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          scanQRCode()
        }
      } catch (err) {
        console.error('Camera error:', err)
        setError('Nu se poate accesa camera. Vă rugăm să acordați permisiuni.')
      }
    }

    function scanQRCode() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || hasScanned.current) return

      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        if (Detector) {
          const barcodeDetector = new Detector({ formats: ['qr_code'] })
          barcodeDetector.detect(imageData)
            .then((barcodes) => {
              if (barcodes.length > 0 && !hasScanned.current) {
                hasScanned.current = true
                const qrData = barcodes[0].rawValue
                if (qrData.includes('/ticket/')) {
                  const ticketId = qrData.split('/ticket/')[1]?.split('?')[0] || qrData
                  router.push(`/dashboard/moderator/tickets/${ticketId}`)
                }
                // unknown QR — reset scan after short delay
                else {
                  setTimeout(() => { hasScanned.current = false }, 2000)
                }
              }
            })
            .catch((err: unknown) => {
              // Runs per animation frame, so only surface the first failure.
              if (detectErrorReported.current) return
              detectErrorReported.current = true
              console.error('QR detection error:', err)
              setError('Scanarea a eșuat. Căutați biletul după număr mai jos.')
              setManualOpen(true)
            })
        }
      }

      animationId = requestAnimationFrame(scanQRCode)
    }

    startCamera()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [router])

  const handleLookup = async () => {
    const num = ticketNumber.trim()
    if (!num || isNaN(Number(num))) return
    setLookupLoading(true)
    setLookupError(null)
    setFound(null)
    try {
      const res = await fetch(`/api/admin/tickets/lookup?number=${encodeURIComponent(num)}`)
      const data = await res.json()
      if (!res.ok) {
        setLookupError(data.error || 'Eroare necunoscută')
      } else {
        setFound(data)
      }
    } catch {
      setLookupError('Eroare de rețea')
    } finally {
      setLookupLoading(false)
    }
  }

  const handleConfirm = () => {
    if (found) router.push(`/dashboard/moderator/tickets/${found.ticketId}`)
  }

  const resetManual = () => {
    setManualOpen(false)
    setTicketNumber('')
    setFound(null)
    setLookupError(null)
  }

  const statusColor = (s: string) =>
    s === 'used' ? 'text-green-400' : s === 'cancelled' ? 'text-red-400' : 'text-primary'
  const statusLabel = (s: string) =>
    s === 'used' ? 'Folosit' : s === 'cancelled' ? 'Anulat' : 'Activ'

  return (
    <div className="space-y-4">
      <div className="mimesiss-card overflow-hidden">
        <div className="relative w-full min-h-[300px] bg-black">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-primary rounded-lg" />
          </div>
        </div>
        <div className="p-4 bg-muted/30 text-center">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Scanați QR-ul de pe biletul emis</p>
          )}
        </div>
      </div>

      {/* Manual input panel */}
      {manualOpen ? (
        <div className="mimesiss-card p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Căutare după număr bilet</h3>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={ticketNumber}
              onChange={(e) => { setTicketNumber(e.target.value); setFound(null); setLookupError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder="ex. 42"
              className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleLookup}
              disabled={lookupLoading || !ticketNumber.trim()}
              className="mimesiss-btn-primary text-sm px-4 disabled:opacity-50"
            >
              {lookupLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
              ) : (
                <FaSearch className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {lookupError && (
            <p className="text-sm text-destructive">{lookupError}</p>
          )}

          {found && (
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaTicketAlt className="h-4 w-4 text-primary" />
                  <span className="font-mono text-primary font-semibold">
                    #{String(found.ticketNumber).padStart(4, '0')}
                  </span>
                </div>
                <span className={`text-xs font-medium ${statusColor(found.status)}`}>
                  {statusLabel(found.status)}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{found.ticketTitle}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FaUser className="h-3.5 w-3.5 shrink-0" />
                <span>{found.owner.name}</span>
                {found.owner.email && found.owner.email !== found.owner.name && (
                  <span className="text-xs">({found.owner.email})</span>
                )}
              </div>
              <button onClick={handleConfirm} className="w-full mimesiss-btn-primary text-sm">
                Deschide bilet
              </button>
            </div>
          )}

          <button onClick={resetManual} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
            Anulează
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="flex-1 mimesiss-btn-secondary text-sm"
          >
            Introdu manual
          </button>
          <Link href="/dashboard/moderator" className="mimesiss-btn-secondary text-sm flex items-center gap-2">
            <FaArrowLeft className="h-3 w-3" />
            Înapoi
          </Link>
        </div>
      )}
    </div>
  )
}

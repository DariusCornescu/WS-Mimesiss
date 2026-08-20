'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import { FaQrcode, FaTimes } from 'react-icons/fa'

interface TicketQRPopoverProps {
  ticketId: string
  ticketLabel: string
}

export default function TicketQRPopover({ ticketId, ticketLabel }: TicketQRPopoverProps) {
  const [open, setOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [generated, setGenerated] = useState(false)

  const handleOpen = async () => {
    if (!generated) {
      const url = `${window.location.origin}/ticket/${ticketId}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 280,
        margin: 2,
        color: { dark: '#DF5739', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(dataUrl)
      setGenerated(true)
    }
    setOpen(true)
  }

  const handleClose = () => setOpen(false)

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <FaQrcode className=" size-10" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-xs shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm">{ticketLabel}</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR cod bilet ${ticketLabel}`}
                  className="rounded-lg"
                  width={240}
                  height={240}
                />
              ) : (
                <div className="w-60 h-60 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                </div>
              )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Prezintă acest cod la intrare pentru validare.
            </p>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`bilet-${ticketLabel.replace(/\s+/g, '-')}.png`}
                className="block w-full text-center text-xs text-primary hover:underline"
              >
                Descarcă QR
              </a>
            )}
          </div>
        </div>
      )}
    </>
  )
}

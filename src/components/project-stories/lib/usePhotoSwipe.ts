'use client'

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'

const isViewportZoomed = () => typeof window !== 'undefined' && (window.visualViewport?.scale ?? 1) > 1.01

export function usePhotoSwipe({ onNext, onPrevious }: { onNext: () => void; onPrevious: () => void }) {
  const start = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const consumed = useRef(false)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const syncZoom = () => {
      start.current = null
      consumed.current = false
      setZoomed(viewport.scale > 1.01)
    }
    syncZoom()
    viewport.addEventListener('resize', syncZoom)
    return () => viewport.removeEventListener('resize', syncZoom)
  }, [])

  return {
    style: zoomed ? { touchAction: 'auto' as const } : undefined,
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      consumed.current = false
      if (isViewportZoomed() || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) {
        start.current = null
        return
      }
      start.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const origin = start.current
      start.current = null
      if (!origin || origin.pointerId !== event.pointerId || isViewportZoomed()) return
      const horizontal = event.clientX - origin.x
      const vertical = event.clientY - origin.y
      if (Math.abs(horizontal) < 45 || Math.abs(horizontal) < Math.abs(vertical) * 1.3) return
      consumed.current = true
      event.preventDefault()
      if (horizontal < 0) onNext()
      else onPrevious()
    },
    onPointerCancel: () => { start.current = null; consumed.current = false },
    onClickCapture: (event: MouseEvent<HTMLElement>) => {
      if (event.detail === 0) {
        consumed.current = false
        return
      }
      if (!consumed.current) return
      event.preventDefault()
      event.stopPropagation()
      consumed.current = false
    },
  }
}

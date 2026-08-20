'use client'

import { useEffect, useState } from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    // Start exit animation before duration ends
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
      setIsVisible(false)
    }, duration)

    // Remove toast after exit animation
    const removeTimer = setTimeout(() => {
      onClose()
    }, duration + 300)

    return () => {
      clearTimeout(exitTimer)
      clearTimeout(removeTimer)
    }
  }, [duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const styles = {
    success: {
      bg: 'bg-green-500/90 dark:bg-green-600/90',
      icon: <FaCheckCircle className="h-5 w-5" />
    },
    error: {
      bg: 'bg-red-500/90 dark:bg-red-600/90',
      icon: <FaExclamationCircle className="h-5 w-5" />
    },
    info: {
      bg: 'bg-blue-500/90 dark:bg-blue-600/90',
      icon: <FaInfoCircle className="h-5 w-5" />
    }
  }[type]

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg backdrop-blur-sm
        transition-all duration-300 ease-in-out min-w-[300px] max-w-md
        ${styles.bg}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex-shrink-0">
        {styles.icon}
      </div>
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="flex-shrink-0 hover:bg-white/20 rounded p-1 transition-colors"
        aria-label="Close"
      >
        <FaTimes className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  children: React.ReactNode
}

export function ToastContainer({ children }: ToastContainerProps) {
  return <div className="toast-container">{children}</div>
}

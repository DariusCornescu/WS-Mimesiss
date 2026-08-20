'use client'

import { useState, useTransition } from 'react'
import { FaTrash } from 'react-icons/fa'
import { deleteWorkshop } from '@/app/admin/workshops/actions'

interface DeleteWorkshopButtonProps {
  workshopId: string
  workshopTitle: string
}

// Simple CSS spinner component
function Spinner() {
  return (
    <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
  )
}

export default function DeleteWorkshopButton({ workshopId, workshopTitle }: DeleteWorkshopButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteWorkshop(workshopId)
        setShowConfirm(false)
      } catch (error) {
        console.error('Error deleting workshop:', error)
        alert('Failed to delete workshop: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    })
  }

  if (showConfirm) {
    return (
      <div className="space-y-2">
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700 mb-2">
            Delete &quot;{workshopTitle}&quot;?
          </p>
          <div className="flex space-x-2">
            <button
              type='button'
              onClick={handleDelete}
              disabled={isPending}
              className="inline-flex items-center gap-1 px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isPending && <Spinner />}
              {isPending ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              type='button'
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="inline-flex items-center px-2 py-1 border border-input text-xs font-medium rounded text-foreground bg-card hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type='button'
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-card hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      <FaTrash className="h-4 w-4 mr-1" />
      Delete
    </button>
  )
}

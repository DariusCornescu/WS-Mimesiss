'use client'

import { useState } from 'react'
import Select from 'react-select'
import type { User as UserType, Workshop as WorkshopType } from '@/types/models'
import { manuallyAssignUserToWorkshop } from '@/app/admin/workshops/actions'
import { useRouter } from 'next/navigation'

interface ManualAssignmentFormProps {
  users: UserType[]
  workshops: WorkshopType[]
}

type SelectOption = {
  value: string
  label: string
}

export function ManualAssignmentForm({ users, workshops }: ManualAssignmentFormProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<SelectOption | null>(null)
  const [selectedWorkshop, setSelectedWorkshop] = useState<SelectOption | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Transform users into select options
  const userOptions: SelectOption[] = users.map(user => ({
    value: user.clerkId,
    label: `${user.firstName || ''} ${user.lastName || ''} (${user.email})`.trim()
  }))

  // Transform workshops into select options
  const workshopOptions: SelectOption[] = workshops.map(workshop => {
    const isFull = workshop.wsType !== 'conferinta' && workshop.currentParticipants >= workshop.maxParticipants
    const capacity = workshop.wsType === 'conferinta' 
      ? 'Nelimitat' 
      : `${workshop.currentParticipants}/${workshop.maxParticipants}`
    
    return {
      value: String(workshop._id || workshop.id || ''),
      label: `${workshop.title} (${workshop.wsType}) - ${capacity}${isFull ? ' - COMPLET' : ''}`
    }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedUser || !selectedWorkshop) {
      setMessage({ type: 'error', text: 'Vă rugăm selectați un utilizator și un workshop' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await manuallyAssignUserToWorkshop(selectedUser.value, selectedWorkshop.value)

      if (result.success) {
        setMessage({ type: 'success', text: 'Utilizatorul a fost alocat cu succes la workshop!' })
        setSelectedUser(null)
        setSelectedWorkshop(null)
        // Refresh the page to get updated workshop capacities
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.error || 'A apărut o eroare' })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'A apărut o eroare neașteptată' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Selection */}
      <div>
        <label htmlFor="user-select" className="block text-sm font-medium text-foreground mb-2">
          Selectează Utilizator
        </label>
        <Select
          id="user-select"
          value={selectedUser}
          onChange={setSelectedUser}
          options={userOptions}
          placeholder="Caută utilizator după nume sau email..."
          isClearable
          isSearchable
          className="react-select-container"
          classNamePrefix="react-select"
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              '&:hover': {
                borderColor: 'hsl(var(--border))'
              }
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              border: '1px solid hsl(var(--border))'
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
              color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
              '&:hover': {
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))'
              }
            }),
            input: (base) => ({
              ...base,
              color: 'hsl(var(--foreground))'
            }),
            singleValue: (base) => ({
              ...base,
              color: 'hsl(var(--foreground))'
            })
          }}
        />
      </div>

      {/* Workshop Selection */}
      <div>
        <label htmlFor="workshop-select" className="block text-sm font-medium text-foreground mb-2">
          Selectează Workshop
        </label>
        <Select
          id="workshop-select"
          value={selectedWorkshop}
          onChange={setSelectedWorkshop}
          options={workshopOptions}
          placeholder="Caută workshop după nume..."
          isClearable
          isSearchable
          className="react-select-container"
          classNamePrefix="react-select"
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              '&:hover': {
                borderColor: 'hsl(var(--border))'
              }
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: 'hsl(var(--background))',
              borderColor: 'hsl(var(--border))',
              border: '1px solid hsl(var(--border))'
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused ? 'hsl(var(--accent))' : 'hsl(var(--background))',
              color: state.isFocused ? 'hsl(var(--accent-foreground))' : 'hsl(var(--foreground))',
              '&:hover': {
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))'
              }
            }),
            input: (base) => ({
              ...base,
              color: 'hsl(var(--foreground))'
            }),
            singleValue: (base) => ({
              ...base,
              color: 'hsl(var(--foreground))'
            })
          }}
        />
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !selectedUser || !selectedWorkshop}
          className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Se procesează...' : 'Alocă Utilizatorul'}
        </button>
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import Select from 'react-select'
import type { StylesConfig } from 'react-select'
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

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: '44px',
    backgroundColor: 'hsl(var(--background))',
    borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))',
    boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--ring))' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--border))'
    }
  }),
  menu: (base) => ({
    ...base,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))'
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? 'hsl(var(--primary))'
      : state.isFocused
        ? 'hsl(var(--accent))'
        : 'hsl(var(--popover))',
    color: state.isSelected
      ? 'hsl(var(--primary-foreground))'
      : state.isFocused
        ? 'hsl(var(--accent-foreground))'
        : 'hsl(var(--foreground))',
    '&:active': {
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))'
    }
  }),
  input: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))'
  }),
  singleValue: (base) => ({
    ...base,
    color: 'hsl(var(--foreground))'
  }),
  placeholder: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))'
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: 'hsl(var(--border))'
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))'
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'hsl(var(--muted-foreground))'
  })
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
          Selectează utilizatorul
        </label>
        <Select
          inputId="user-select"
          instanceId="manual-assignment-user"
          value={selectedUser}
          onChange={setSelectedUser}
          options={userOptions}
          placeholder="Caută utilizator după nume sau email..."
          isClearable
          isSearchable
          isDisabled={isSubmitting}
          aria-invalid={message?.type === 'error' && !selectedUser}
          aria-describedby={message ? 'manual-assignment-message' : undefined}
          noOptionsMessage={() => 'Nu a fost găsit niciun utilizator.'}
          className="react-select-container"
          classNamePrefix="react-select"
          styles={selectStyles}
        />
      </div>

      {/* Workshop Selection */}
      <div>
        <label htmlFor="workshop-select" className="block text-sm font-medium text-foreground mb-2">
          Selectează workshop-ul
        </label>
        <Select
          inputId="workshop-select"
          instanceId="manual-assignment-workshop"
          value={selectedWorkshop}
          onChange={setSelectedWorkshop}
          options={workshopOptions}
          placeholder="Caută workshop după nume..."
          isClearable
          isSearchable
          isDisabled={isSubmitting}
          aria-invalid={message?.type === 'error' && !selectedWorkshop}
          aria-describedby={message ? 'manual-assignment-message' : undefined}
          noOptionsMessage={() => 'Nu a fost găsit niciun workshop.'}
          className="react-select-container"
          classNamePrefix="react-select"
          styles={selectStyles}
        />
      </div>

      {/* Message Display */}
      {message && (
        <div
          id="manual-assignment-message"
          role={message.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`rounded-lg border p-4 text-sm ${
            message.type === 'success'
              ? 'border-accent/40 bg-accent/10 text-foreground'
              : 'border-destructive/40 bg-destructive/10 text-destructive'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !selectedUser || !selectedWorkshop}
          aria-busy={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-transparent bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? 'Se procesează...' : 'Alocă utilizatorul'}
        </button>
      </div>
    </form>
  )
}

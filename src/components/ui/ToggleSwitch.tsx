'use client'

import { useId, useState } from 'react'

interface ToggleSwitchProps {
  name: string
  label: string
  description?: string
  defaultChecked?: boolean
  disabled?: boolean
  onChange?: (checked: boolean) => void
}

export default function ToggleSwitch({ 
  name, 
  label, 
  description, 
  defaultChecked = false, 
  disabled = false,
  onChange 
}: ToggleSwitchProps) {
  const [isChecked, setIsChecked] = useState(defaultChecked)

  const handleToggle = () => {
    if (disabled) return
    
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange?.(newValue)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    handleToggle()
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleToggle()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleToggle()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center">
        {/* Hidden input for form submission */}
        <input
          type="checkbox"
          id={useId()}
          name={name}
          checked={isChecked}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
          onClick={handleClick}
        />
        
        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isChecked}
          aria-labelledby={`${useId()}-label`}
          disabled={disabled}
          onClick={handleClick}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer'
          } ${
            isChecked 
              ? 'bg-primary' 
              : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isChecked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      
      {/* Label and Description */}
      <div className="flex-1">
        <label
          htmlFor={name}
          id={`${useId()}-label`}
          className={`text-sm font-medium text-foreground ${
            disabled ? 'opacity-50' : 'cursor-pointer'
          }`}
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { User } from '@/types/models'

interface UseMongoUserReturn {
  user: User | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useMongoUser(): UseMongoUserReturn {
  const { user: clerkUser, isLoaded } = useUser()
  const [mongoUser, setMongoUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (!clerkUser?.id) {
      setIsLoading(false)
      setMongoUser(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/${clerkUser.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }
      
      const userData = await response.json()
      setMongoUser(userData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data'
      setError(errorMessage)
      console.error('Error fetching MongoDB user:', err)
    } finally {
      setIsLoading(false)
    }
  }, [clerkUser?.id])

  useEffect(() => {
    if (isLoaded) {
      fetchUser()
    }
  }, [isLoaded, fetchUser])

  const refetch = useCallback(() => {
    fetchUser()
  }, [fetchUser])

  return {
    user: mongoUser,
    isLoading: !isLoaded || isLoading,
    error,
    refetch
  }
}
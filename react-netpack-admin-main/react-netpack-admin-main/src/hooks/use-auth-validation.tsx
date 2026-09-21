import { useEffect, useRef } from 'react'
import { validateToken, validateTokenSync, logout } from '@/lib/auth'

// Check if current page is an auth page or public customer PWA
const isAuthPage = (): boolean => {
  const path = window.location.pathname
  return (
    path === '/' ||                        // Public landing / home page
    path.startsWith('/pwa') ||             // Customer PWA
    path.startsWith('/pickup-pwa') ||      // Rider PWA
    path.startsWith('/landing') ||         // Landing alias
    path.includes('/sign-in') ||
    path.includes('/sign-up') ||
    path.includes('/forgot-password') ||
    path.includes('/otp')
  )
}

export const useAuthValidation = (checkIntervalMs: number = 60000) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Skip validation on auth pages
    if (isAuthPage()) {
      return
    }

    // Add a delay before initial validation to prevent immediate logout after login
    const initialValidationTimeout = setTimeout(() => {
      // Initial validation (sync for immediate check)
      if (!validateTokenSync()) {
        return
      }
    }, 2000) // 2 second delay

    // Set up periodic validation with server
    intervalRef.current = setInterval(async () => {
      // Skip validation on auth pages
      if (isAuthPage()) {
        return
      }

      try {
        const isValid = await validateToken()
        if (!isValid) {
          console.log('Token validation failed, logging out...')
          logout()
        }
      } catch (error) {
        console.error('Token validation error:', error)
        // Don't logout on validation errors, just log them
      }
    }, checkIntervalMs)

    // Cleanup on unmount
    return () => {
      clearTimeout(initialValidationTimeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkIntervalMs])

  // Also validate on window focus (user returns to tab)
  useEffect(() => {
    const handleFocus = async () => {
      // Skip validation on auth pages
      if (isAuthPage()) {
        return
      }

      try {
        const isValid = await validateToken()
        if (!isValid) {
          console.log('Token validation failed on window focus, logging out...')
          logout()
        }
      } catch (error) {
        console.error('Token validation error on focus:', error)
        // Don't logout on validation errors, just log them
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return {
    validateNow: async () => {
      // Skip validation on auth pages
      if (isAuthPage()) {
        return true
      }

      try {
        return await validateToken()
      } catch (error) {
        console.error('Token validation error:', error)
        return false
      }
    },
  }
}

import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from '@tanstack/react-router'
import { getToken, isAuthenticated } from '@/lib/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const path = window.location.pathname
  const token = getToken()

  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await isAuthenticated()
      setAuthenticated(isAuth)
      setLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    // Wait for async auth check to finish before redirecting
    if (loading) return

    // If not authenticated (no token), redirect to /pwa on mobile, or admin /sign-in on desktop
    if (!token) {
      const isMobile =
        typeof window !== 'undefined' &&
        (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768)
      if (isMobile) {
        navigate({ to: '/pwa' })
        return
      }
      navigate({ to: '/sign-in' })
      return
    }
  }, [path, token, navigate])

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        Loading...
      </div>
    )
  }

  if (!authenticated) {
    const isMobile =
      typeof window !== 'undefined' &&
      (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth <= 768)
    if (isMobile) {
      return <Navigate to='/pwa' />
    }
    return <Navigate to='/sign-in' />
  }

  return <>{children}</>
}

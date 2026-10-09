import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import CustomerPWA from '@/features/pwa'

function CustomerPWARoute() {
  useEffect(() => {
    document.title = 'Netpack Customer Portal'
    return () => {
      document.title = 'Netpack Admin'
    }
  }, [])

  return <CustomerPWA />
}

// @ts-ignore
export const Route = createFileRoute('/pwa')({
  component: CustomerPWARoute,
})

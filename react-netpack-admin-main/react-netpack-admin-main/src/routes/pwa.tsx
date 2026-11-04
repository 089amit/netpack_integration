import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import CustomerPWA from '@/features/pwa'

function CustomerAppRoute() {
  useEffect(() => {
    document.title = 'Netpack Customer App'
    return () => {
      document.title = 'Netpack Admin'
    }
  }, [])

  return <CustomerPWA />
}

// @ts-ignore
export const Route = createFileRoute('/pwa')({
  component: CustomerAppRoute,
})

import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import PickupRiderPWA from '@/features/pickup-pwa'

function PickupRiderRoute() {
  useEffect(() => {
    document.title = 'Netpack Rider Dispatch'
    return () => {
      document.title = 'Netpack Admin'
    }
  }, [])

  return <PickupRiderPWA />
}

// @ts-ignore
export const Route = createFileRoute('/pickup-pwa')({
  component: PickupRiderRoute,
})

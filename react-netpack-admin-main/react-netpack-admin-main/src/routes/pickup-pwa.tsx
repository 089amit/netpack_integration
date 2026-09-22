import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import PickupRiderPWA from '@/features/pickup-pwa'

function PickupRiderRoute() {
  useEffect(() => {
    document.title = 'Netpack Rider'
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (link) {
      link.href = '/manifest-pickup.webmanifest'
    }
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
    if (appleIcon) {
      appleIcon.href = '/images/netpack-rider-icon-192.png'
    }
    return () => {
      document.title = 'Netpack Admin'
      if (link) link.href = '/manifest.webmanifest'
      if (appleIcon) appleIcon.href = '/images/netpack-icon-192.png'
    }
  }, [])

  return <PickupRiderPWA />
}

// @ts-ignore
export const Route = createFileRoute('/pickup-pwa')({
  component: PickupRiderRoute,
})

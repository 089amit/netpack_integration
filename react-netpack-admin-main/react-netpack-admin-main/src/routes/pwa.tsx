import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import CustomerPWA from '@/features/pwa'

function CustomerPWARoute() {
  useEffect(() => {
    document.title = 'Netpack'
    const link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (link) {
      link.href = '/manifest.webmanifest'
    }
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
    if (appleIcon) {
      appleIcon.href = '/images/netpack-icon-192.png'
    }
    return () => {
      document.title = 'Netpack Admin'
      if (link) link.href = '/manifest.webmanifest'
      if (appleIcon) appleIcon.href = '/images/netpack-icon-192.png'
    }
  }, [])

  return <CustomerPWA />
}

// @ts-ignore
export const Route = createFileRoute('/pwa')({
  component: CustomerPWARoute,
})

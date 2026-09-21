import { createFileRoute } from '@tanstack/react-router'
import CustomerPWA from '@/features/pwa'

// @ts-ignore
export const Route = createFileRoute('/pwa')({
  component: CustomerPWA,
})

import { createFileRoute } from '@tanstack/react-router'
import PickupRiderPWA from '@/features/pickup-pwa'

// @ts-ignore
export const Route = createFileRoute('/pickup-pwa')({
  component: PickupRiderPWA,
})

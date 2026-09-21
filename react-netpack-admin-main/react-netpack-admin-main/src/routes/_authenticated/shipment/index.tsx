import { createFileRoute } from '@tanstack/react-router'
import Shipment from '@/features/shipment'

export const Route = createFileRoute('/_authenticated/shipment/')({
  component: Shipment,
})

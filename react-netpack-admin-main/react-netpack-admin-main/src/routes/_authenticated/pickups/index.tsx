import { createFileRoute } from '@tanstack/react-router'
import Pickups from '@/features/pickups'

export const Route = createFileRoute('/_authenticated/pickups/')({
  component: Pickups,
})

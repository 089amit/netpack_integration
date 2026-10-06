import { createFileRoute } from '@tanstack/react-router'
import SurchargesPage from '@/features/surcharges'

export const Route = createFileRoute('/_authenticated/surcharges/')({
  component: SurchargesPage,
})

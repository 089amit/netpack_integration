import { createFileRoute } from '@tanstack/react-router'
import CustomManifest from '@/features/custom-manifest'

export const Route = createFileRoute('/_authenticated/custom-manifest/')({
  component: CustomManifest,
})


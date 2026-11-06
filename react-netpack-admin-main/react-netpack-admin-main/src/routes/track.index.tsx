import { createFileRoute } from '@tanstack/react-router'
import PublicTrackingPage from '@/features/tracking/public-tracking-page'

// @ts-ignore
export const Route = createFileRoute('/track/')({
  component: () => <PublicTrackingPage />,
})

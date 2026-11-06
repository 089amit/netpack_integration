import { createFileRoute } from '@tanstack/react-router'
import PublicTrackingPage from '@/features/tracking/public-tracking-page'

// @ts-ignore
export const Route = createFileRoute('/track/$trackingNumber')({
  component: TrackRouteComponent,
})

function TrackRouteComponent() {
  const params = Route.useParams() as any
  const trackingNumber = params?.trackingNumber
  return <PublicTrackingPage trackingId={trackingNumber} />
}

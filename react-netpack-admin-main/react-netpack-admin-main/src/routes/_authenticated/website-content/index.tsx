import { createFileRoute } from '@tanstack/react-router'
import WebsiteContentPage from '@/features/website-content'

export const Route = createFileRoute('/_authenticated/website-content/')({
  component: WebsiteContentPage,
})

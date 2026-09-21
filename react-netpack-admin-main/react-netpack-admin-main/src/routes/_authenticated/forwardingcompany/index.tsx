import { createFileRoute } from '@tanstack/react-router'
import ForwardingCompanies from '@/features/forwardingcompany'

// import Tasks from '@/features/tasks'

export const Route = createFileRoute('/_authenticated/forwardingcompany/')({
  component: ForwardingCompanies,
})

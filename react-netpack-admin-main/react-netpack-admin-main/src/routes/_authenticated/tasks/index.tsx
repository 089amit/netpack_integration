import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: () => <Navigate to='/enquiries' replace />,
})

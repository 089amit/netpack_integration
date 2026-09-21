import { createFileRoute } from '@tanstack/react-router'
import MAWB from '@/features/mawb'
// import Tasks from '@/features/tasks'

export const Route = createFileRoute('/_authenticated/mawb/')({
  component: MAWB,
})

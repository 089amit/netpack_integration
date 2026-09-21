import { createFileRoute } from '@tanstack/react-router'
import TermsAndPolicies from '@/features/terms-and-policies'

export const Route = createFileRoute('/_authenticated/terms-and-policies/')({
  component: TermsAndPolicies,
})

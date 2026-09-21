import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import Customers from '@/features/customer'

const customerSearchSchema = z.object({
  page: z.string().catch('1'),
  limit: z.string().catch('10'),
  search: z.string().catch(''),
  gender: z.array(z.string()).catch([]),
  countryId: z.array(z.string()).catch([]),
  isOrganization: z.string().catch(''),
})

export const Route = createFileRoute('/_authenticated/customers/')({
  component: Customers,
  validateSearch: customerSearchSchema,
})

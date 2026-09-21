// src/schema/forwardingCompanyFormSchema.ts
import { z } from 'zod'

export const forwardingCompanyFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
})

export type ForwardingCompany = z.infer<typeof forwardingCompanyFormSchema>

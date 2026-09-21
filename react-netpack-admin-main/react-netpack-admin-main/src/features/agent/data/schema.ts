// src/lib/schema.ts
import { z } from 'zod'

export const agentSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().nullish(),
  country: z.string().nullish(),
  city: z.string().nullish(),
  address: z.string().nullish(),
  postcode: z.string().nullish(),
  phone: z.string().nullish(),
  code: z.string().nullish(),
})

export type AgentFormValues = z.infer<typeof agentSchema>

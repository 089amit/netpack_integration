import { z } from 'zod'

export const enquiryFormSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  label: z.string(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  weight: z
    .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
    .optional(),
})

export type Task = z.infer<typeof enquiryFormSchema>

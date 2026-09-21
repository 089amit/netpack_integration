import { z } from 'zod'

export const mawbFormSchema = z.object({
  id: z.string(),
  mawbNumber: z.string().min(1, 'MAWB number is required'),
  departureDate: z.string().optional(),
  departureDateRaw: z.string().optional(),
  airlineName: z.string().nullable(),
  destination: z.string().nullable().optional(),
  hasShipment: z.boolean().optional(),
  documentUrl: z.string().optional().nullable(),
  agentId: z.number().int().positive().nullish(),
  flightNumber: z.string().optional().nullable(),
  dateOfArrival: z.string().optional().nullable(),
  timeOfArrival: z.string().optional().nullable(),
})

export type MAWB = z.infer<typeof mawbFormSchema>

import { z } from 'zod'

// ✅ Customer Form Schema
export const customerFormSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().nullable(), // Allow null
  address1: z.string().optional().nullable(),
  address2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  postcode: z.string().optional().nullable(),
  countryId: z.number().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  email: z
    .union([z.string().email('Must be a valid email'), z.literal(''), z.null()])
    .optional(),
  organizationName: z.string().optional().nullable(),
  isOrganization: z.boolean(),
}).passthrough()

export type CustomerFormValues = z.infer<typeof customerFormSchema>

import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userSchema = z.object({
  id: z.number(),
  fullName: z.string().nullable(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  role: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  address1: z.string().nullable().optional(),
  address2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  countryId: z.union([z.string(), z.number()]).nullable().optional(),
  isOrganization: z.boolean().nullable().optional(),
  organizationName: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)

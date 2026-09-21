// Inside your component or in a separate file like `formSchema.ts`
import { z } from 'zod'

export const countryFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Country name is required'),
  boxWeightLimit: z
    .number()
    .positive('Box weight limit must be greater than 0'),
  isActive: z.boolean().default(true),
  zoneId: z.number().nullable().optional(),
})

export type CountryFormValues = z.infer<typeof countryFormSchema>

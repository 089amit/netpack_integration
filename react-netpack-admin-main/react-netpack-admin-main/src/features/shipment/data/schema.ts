// src/types/shipment-form.ts
import { z } from 'zod'

export const shipmentFormSchema = z.object({
  id: z.string(),
  status: z.enum([
    'PENDING',
    'PICKED_UP',
    'IN_TRANSIT',
    'ARRIVED_AT_HUB',
    'CARRIER_SCANNED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'SHIPMENT_CREATED',
  ]),
  customerPhone: z.string().nullish(),
  customerId: z.number().optional(),
  agentId: z.number().optional(),
  enquiryId: z.number().optional(),
  mawbId: z.number().nullable().optional(),
  forwardingCompanyId: z.number().nullable().optional(),
  serviceId: z.number().nullable().optional(),
  countryId: z.number().nullable().optional(),
  destinationCountryName: z.string().optional(),
  forwardingCompanyName: z.string().optional(),
  serviceName: z.string().optional(),
  hawbNumber: z.string().optional(),
  forwardingNumber: z.string().optional(),
  note: z.string().optional(),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  reciverName: z.string().optional(),
  senderOrganization: z.string().optional(),
  trackingMode: z.enum(['MANUAL', 'API']).default('MANUAL').optional(),
})

export type ShipmentForm = z.infer<typeof shipmentFormSchema>

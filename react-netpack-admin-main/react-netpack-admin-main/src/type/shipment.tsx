// src/types/shipment.ts
import { Country } from './country'
import { Customer } from './customer'

export type Shipment = {
  reciverNdame: any
  reciverName: any
  customerPhone: string
  countryId: any
  enquiryId: any
  id: number
  customerId: number
  destinationLocation: string | null
  pincode: number | null
  destinationCountry: number
  forwardingCompanyId: number | null
  serviceId: number | null
  mawbId: number | null
  status: ShipmentStatus
  estimatedRate: number | null
  finalRate: number | null
  createdAt: string
  updatedAt: string
  pickupLocations: ShipmentPickupLocation[]
  country?: Country
  customer?: Customer
  enquiryDetails?: any
  mawbDetails?: any
  senderName?: string
  senderPhone?: string
  mawb?: any
  destinationCountryName?: string
  hawbno?: string
  hawbNumber?: string
  forwardingNumber?: string
  note?: string
  trackingNumber?: string | null
}

export type ShipmentTableRow = {
  id: number
  title: string
  status: string
  label: string
  customerName: string
  customerPhone: string
  destinationCountryName: string
}

export interface ShipmentItem {
  id: string
  status:
    | 'PENDING'
    | 'PICKED_UP'
    | 'IN_TRANSIT'
    | 'ARRIVED_AT_HUB'
    | 'CARRIER_SCANNED'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'

  customerPhone: string
  destinationCountryName: string
  forwardingCompanyName: string
  serviceName: string
  hawbNumber?: string
  hawbno?: string
  agentId?: number
  agent?: string
  agentCode?: string
  forwardingNumber?: string
  note?: string
  senderName?: string
  senderPhone?: string
  senderOrganization?: string
  reciverName?: string

  // 👇 Add these if you're using them in form
  customerId?: number
  enquiryId?: number
  mawbId?: number | null
  forwardingCompanyId?: number | null
  serviceId?: number | null
  countryId?: number | null
  trackingNumber?: string | null
}

export type ShipmentStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED_AT_HUB'
  | 'CARRIER_SCANNED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'

export type ShipmentPickupLocation = {
  location: string
  phoneNumber?: string
}

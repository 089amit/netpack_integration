// src/types/mawb.ts

export interface MAWB {
  id: number
  mawbNumber: string // Make sure this is a string (like "123-4567890")
  departureDate: string
  departureDateRaw?: string
  airlineName: string | null
  destination: string
  createdAt?: string
  updatedAt?: string
  hasShipment: boolean
  documentUrl: string
  agentId?: number | null
  flightNumber?: string
  dateOfArrival?: string | null
  timeOfArrival?: string | null
}

export type MAWBFormValues = {
  mawbNumber: string
  departureDate: string
}

export interface MAWBResponse {
  data: MAWB[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// ✅ Simplified type for DataTable
export type MAWBTableItem = {
  id: string
  mawbNumber: string
  departureDate: string
  departureDateRaw?: string
  airlineName: string
  destination: string
  hasShipment: boolean
  documentUrl: string
  agentId?: number | null
  flightNumber?: string
  dateOfArrival?: string
  timeOfArrival?: string
}

// src/types/enquiry.ts

// Pickup Location for Enquiry
export interface PickupLocation {
  id: number
  enquiryId: number
  location: string
  phoneNumber: string | null
  createdAt: string
  updatedAt: string
}

// Country Info
export interface Country {
  id: number
  name: string
  isActive: boolean
  boxWeightLimit: number
  zoneId: number | null
}

// Customer Info
export interface Customer {
  id: number
  name: string
  phone: string
  address: string
  password: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  isOrganization: boolean
  organizationName: string | null
  firebaseUid: string
  createdAt: string
  updatedAt: string
}

// Enquiry Main Model
// src/types/enquiry.ts

// This should match what's returned from the backend
export interface Enquiry {
  [x: string]: any
  id: number
  customerId: number
  destinationLocation: string
  pinCode: string | null
  destinationCountry: number
  noOfBox: number | null
  weight: number
  status: string
  trackingNumber: string | null
  estimatedRate: any | null
  finalRate: any | null
  createdAt: string
  updatedAt: string
  mawbId: number | null
  pickupLocations: PickupLocation[]
  customer: Customer
  country: Country
  // Sender Info
  senderName: string | null
  senderAddressLine1: string | null
  senderAddressLine2: string | null
  senderPostcodeCity: string | null
  senderLocation: string | null
  senderCountry: string | null
  senderPhone: string | null
  senderEmail: string | null
  // Receiver Info
  receiverName: string | null
  recivercompanyName: string | null
  receiverAddressLine1: string | null
  receiverAddressLine2: string | null
  receiverPostcodeCity: string | null
  receiverLocation: string | null
  receiverCountry: string | null
  receiverTelephone: string | null
  receiverEmail: string | null
}

// Response Type for GET /api/enquiry
export interface EnquiryResponse {
  count: number
  data: Enquiry[]
}

// Simplified type for DataTable
export type EnquiryItem = {
  id: string
  title: string
  status: string
  label: string
  customerName: string
  customerPhone: string
}

// Item Row for Form
export interface EnquiryItemRow {
  description: string
  weight: string
  value: string
  quantity: string
  unitPrice: string
  hsCode: string
  totalValue: string
}

// Sender Info
export interface SenderInfo {
  id?: string | number
  name: string
  addressLine1: string
  addressLine2: string
  postcodeCity: string
  location: string
  country: string
  telephoneEmail: string
}

// Receiver Info
export interface ReceiverInfo {
  name: string
  addressLine1: string
  addressLine2: string
  postcodeCity: string
  location: string
  country: string
  telephone: string
  email: string
}

// Full Form Data Structure
export interface EnquiryFormData {
  sender: SenderInfo
  receiver: ReceiverInfo
  items: EnquiryItemRow[]
}

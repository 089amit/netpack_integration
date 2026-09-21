export interface ItemRow {
  description: string
  weight: string
  value: string
  quantity: string
  unitPrice: string
  currency: string
  hsCode: string
  totalValue: string
}

export interface SenderInfo {
  id?: string | number
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  postcode: string
  country: string
  telephone: string
  customerId?: number | string
}

export interface ReceiverInfo {
  name: string
  companyName: string
  addressLine1: string
  addressLine2: string
  city: string
  state?: string
  postcode: string
  location: string
  country: string
  telephone: string
  email: string
}

export interface Box {
  itemSelections: { itemId: string; quantity: number }[]
  quantity: number
  weight: number
  value: number
  length: number
  breadth: number
  height: number
  multiplier: number
}

export interface PickupDetail {
  id?: number
  location: string
  phoneNumber?: string
  note?: string
  preferredTime?: string
}

export interface EnquiryFormData {
  id?: string | number
  sender: SenderInfo
  receiver: ReceiverInfo
  items: ItemRow[]
  destinationCountryId?: string
  destinationLocation?: string
  noOfBox?: number
  weight?: number
  status?: string
  estimatedRate?: number
  finalRate?: number
  boxes?: Box[]
  currency?: string
  handoverType?: 'PICKUP' | 'SELF_DROP'
  pickupLocation?: string
  pickupPhone?: string
  pickupTime?: string
  pickupNote?: string
  pickupLocations?: PickupDetail[]
}
